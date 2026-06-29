from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from .models import PlantCategory, PlantVariety, Subscription, Notification
from .serializers import (
    PlantCategorySerializer, PlantVarietySerializer, 
    SubscriptionSerializer, NotificationSerializer, DynamicCareCardSerializer
)

class PlantCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlantCategory.objects.all()
    serializer_class = PlantCategorySerializer
    permission_classes = [AllowAny] # Publicly accessible

class PlantVarietyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlantVariety.objects.all()
    serializer_class = PlantVarietySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = PlantVariety.objects.all()
        category_id = self.request.query_params.get('category', None)
        if category_id is not None:
            queryset = queryset.filter(category_id=category_id)
        return queryset

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Subscription.objects.none()
            
        # Check if requesting from admin dashboard to allow management
        referer = self.request.META.get('HTTP_REFERER', '')
        is_admin_dashboard = '/admin-dashboard' in referer
        
        # Admin can see all subscriptions in the management dashboard
        if getattr(user, 'role', '') == 'admin' and is_admin_dashboard:
            return Subscription.objects.all().order_by('-start_date')
            
        return Subscription.objects.filter(user=user).order_by('next_delivery_date')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_shipped(self, request, pk=None):
        if getattr(request.user, 'role', '') != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        subscription = self.get_object()
        
        if subscription.status in ['expired', 'completed']:
            return Response({"error": "Subscription already completed"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate max deliveries
        max_deliveries = 1
        plan = str(subscription.plan_type).lower()
        if '24m' in plan: max_deliveries = 8
        elif '12m' in plan: max_deliveries = 4
        elif '6m' in plan: max_deliveries = 2
        elif '3m' in plan: max_deliveries = 1
        
        # Mark current delivery
        subscription.deliveries_completed += 1
        history = list(subscription.history) if subscription.history else []
        history.append({
            "delivery": subscription.deliveries_completed,
            "date": timezone.now().isoformat(),
            "status": "shipped"
        })
        subscription.history = history
        
        if subscription.deliveries_completed >= max_deliveries:
            subscription.status = 'completed'
            subscription.is_active = False
        else:
            subscription.next_delivery_date = timezone.now() + timedelta(days=90)
            subscription.status = 'active'
            
        subscription.save()
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        user = request.user if request.user.is_authenticated else None
        
        # Get custom fields from request
        plan_type = request.data.get('plan_type', '')
        customer_name = request.data.get('customer_name')
        customer_phone = request.data.get('customer_phone')
        shipping_address = request.data.get('shipping_address')
        district = request.data.get('district')
        save_account = request.data.get('save_account', False)
        
        if user and save_account:
            # Update user info if they checked save
            if customer_name and not user.full_name:
                user.full_name = customer_name
            if customer_phone and not user.phone:
                user.phone = customer_phone
            if shipping_address and not user.address:
                user.address = shipping_address
            user.save()
            
        next_delivery = timezone.now() + timedelta(days=30)
            
        sub = Subscription.objects.create(
            user=user,
            plan_type=plan_type,
            next_delivery_date=next_delivery,
            payment_status='paid',
            is_active=True,
            status='active',
            customer_name=customer_name,
            customer_phone=customer_phone,
            shipping_address=shipping_address,
            district=district
        )
        
        if user:
            Notification.objects.create(
                user=user,
                message=f"Your {sub.plan_type} subscription is now active! Your first plant care kit will be delivered soon."
            )
            
        serializer = self.get_serializer(sub)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'notifications marked as read'})

from .models import DynamicCareCard
class DynamicCareCardViewSet(viewsets.ModelViewSet):
    serializer_class = DynamicCareCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = DynamicCareCard.objects.filter(user=user).order_by('-created_at')
        
        # Trigger care check whenever the user looks at their plants
        try:
            today = timezone.now().date()
            for card in queryset:
                # Use fallback dates for calculation without modifying the card object state directly
                last_w = card.last_watered_date or today
                last_f = card.last_fertilized_date or today
                
                template = CareTemplate.objects.filter(category__iexact=card.category).first()
                water_int = card.watering_frequency or (template.watering_interval_days if template else 7)
                fert_int = card.fertilizer_frequency or (template.fertilizer_interval_days if template else 30)

                need_water = (today - last_w).days >= water_int
                need_fert = (today - last_f).days >= fert_int

                # Neon Pothos specific requirement
                if "neon" in card.plant_name.lower():
                    if need_water or need_fert:
                        msg = "It's time to care for your Neon Pothos!"
                        if not Notification.objects.filter(user=user, message=msg, is_read=False).exists():
                            Notification.objects.create(user=user, message=msg)
                else:
                    if need_water:
                        msg = f"It's time to water your {card.plant_name}!"
                        if not Notification.objects.filter(user=user, message=msg, is_read=False).exists():
                            Notification.objects.create(user=user, message=msg)
                    
                    if need_fert:
                        msg = f"It's time to fertilize your {card.plant_name}!"
                        if not Notification.objects.filter(user=user, message=msg, is_read=False).exists():
                            Notification.objects.create(user=user, message=msg)
        except Exception as e:
            import logging
            logging.error(f"Care check error: {e}")

        return queryset

    @action(detail=True, methods=['post'])
    def mark_watered(self, request, pk=None):
        card = self.get_object()
        today = timezone.now().date()
        card.last_watered_date = today
        card.save()
        
        # Auto-Clear watering notifications for this specific plant
        from .models import Notification
        Notification.objects.filter(
            user=request.user, 
            is_read=False, 
            message__icontains=card.plant_name
        ).filter(message__icontains="water").update(is_read=True)
        
        return Response({'status': 'success', 'message': f'Watering updated! Next reminder in {card.watering_frequency} days.'})

    @action(detail=True, methods=['post'])
    def mark_fertilized(self, request, pk=None):
        card = self.get_object()
        today = timezone.now().date()
        card.last_fertilized_date = today
        card.save()
        
        # Auto-Clear fertilizer notifications for this specific plant
        from .models import Notification
        Notification.objects.filter(
            user=request.user, 
            is_read=False, 
            message__icontains=card.plant_name
        ).filter(message__icontains="nutrient").update(is_read=True)
        
        return Response({'status': 'success', 'message': f'Fertilizer applied! Next reminder in {card.fertilizer_frequency} days.'})

    @action(detail=True, methods=['post'])
    def task_completed(self, request, pk=None):
        try:
            # 1. Try to find by primary key (standard DRF)
            card = DynamicCareCard.objects.filter(id=pk, user=request.user).first()
            
            # 2. Fallback: If not found and it might be Neon Pothos, try name-based lookup
            # (Resolves potential ID mismatch or frontend stale data issues)
            if not card:
                card = DynamicCareCard.objects.filter(
                    user=request.user, 
                    plant_name__icontains="Neon"
                ).first()
                
            # 3. Final fallback: standard get_object()
            if not card:
                try:
                    card = self.get_object()
                except:
                    return Response({'error': f'Plant not found for user {request.user.username}'}, status=status.HTTP_404_NOT_FOUND)

            task_type = request.data.get('task_type', '')
            today = timezone.now().date()
            
            if task_type == 'water':
                card.last_watered_date = today
                msg_keyword = "water"
            elif task_type == 'fertilize':
                card.last_fertilized_date = today
                msg_keyword = "fertilize"
            elif task_type == 'repot':
                card.last_repotting_date = today
                msg_keyword = "repot"
            else:
                return Response({'error': 'Invalid task type'}, status=status.HTTP_400_BAD_REQUEST)
                
            card.save()
            
            # Mark unread notifications for this user that mention this plant
            try:
                name_clean = card.plant_name.strip()
                Notification.objects.filter(
                    user=request.user, 
                    is_read=False,
                    message__icontains=name_clean
                ).update(is_read=True)
                
                if "neon" in name_clean.lower():
                    Notification.objects.filter(
                        user=request.user,
                        is_read=False,
                        message__icontains="care for"
                    ).update(is_read=True)
            except:
                pass
                
            return Response({'status': 'updated', 'message': 'Task updated successfully'})
        except Exception as e:
            return Response({'error': f'Update Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def create(self, request, *args, **kwargs):
        if getattr(request.user, 'is_seller', False) or getattr(request.user, 'is_staff', False):
            return Response({'error': 'This section is for community members only.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if request.user == post.user or getattr(request.user, 'is_staff', False):
            post.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)
            is_liked = False
        else:
            post.likes.add(user)
            is_liked = True
            
        return Response({
            'status': 'success', 
            'is_liked_by_user': is_liked,
            'likes_count': post.likes.count()
        })

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        post = self.get_object()
        text = request.data.get('text', '')
        if text:
            comment = Comment.objects.create(post=post, user=request.user, text=text)
            return Response(CommentSerializer(comment).data)
        return Response({'error': 'text required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'], url_path='delete_comment/(?P<comment_id>[^/.]+)')
    def delete_comment(self, request, comment_id=None):
        try:
            comment = Comment.objects.get(id=comment_id)
        except Comment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        if request.user == comment.user or getattr(request.user, 'is_staff', False):
            comment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


from .models import BotanistAppointment, PottingRequest
from .serializers import BotanistAppointmentSerializer, PottingRequestSerializer


class BotanistAppointmentViewSet(viewsets.ModelViewSet):
    """Book and track in-home botanist appointments (the Plant Doctor service)."""
    serializer_class = BotanistAppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = BotanistAppointment.objects.all()
        if getattr(user, 'role', '') != 'admin' and not user.is_staff:
            qs = qs.filter(user=user)
        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        service = data.get('service_type', 'standard')
        distance = data.get('distance', 0) or 0
        base = 500 if service == 'urgent' else 300
        dist_charge = max(0, distance - 5) * 20
        botanist = data.get('preferred_botanist') or 'Not Assigned'
        serializer.save(
            user=self.request.user,
            base_fee=base,
            distance_charge=dist_charge,
            total_fee=base + dist_charge,
            assigned_botanist=botanist,
            status='requested',
        )

    @action(detail=True, methods=['post'])
    def advance_status(self, request, pk=None):
        """Move an appointment to the next stage. Admin/staff only."""
        user = request.user
        if getattr(user, 'role', '') != 'admin' and not user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        appt = self.get_object()
        stages = ['requested', 'assigned', 'in_transit', 'treating', 'completed']
        try:
            idx = stages.index(appt.status)
        except ValueError:
            idx = 0
        if idx < len(stages) - 1:
            appt.status = stages[idx + 1]
        prescription = request.data.get('prescription_notes')
        if prescription is not None:
            appt.prescription_notes = prescription
        botanist = request.data.get('assigned_botanist')
        if botanist:
            appt.assigned_botanist = botanist
        appt.save()
        return Response(self.get_serializer(appt).data)

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Admin/staff set an arbitrary status and optionally assign a botanist."""
        user = request.user
        if getattr(user, 'role', '') != 'admin' and not user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        appt = self.get_object()
        valid = {c[0] for c in BotanistAppointment.STATUS_CHOICES}
        new_status = request.data.get('status')
        if new_status in valid:
            appt.status = new_status
        botanist = request.data.get('assigned_botanist')
        if botanist:
            appt.assigned_botanist = botanist
        prescription = request.data.get('prescription_notes')
        if prescription is not None:
            appt.prescription_notes = prescription
        appt.save()
        return Response(self.get_serializer(appt).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appt = self.get_object()
        if appt.user != request.user and getattr(request.user, 'role', '') != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        appt.status = 'cancelled'
        appt.save()
        return Response(self.get_serializer(appt).data)


class PottingRequestViewSet(viewsets.ModelViewSet):
    """Book and track Expert Potting service requests."""
    serializer_class = PottingRequestSerializer
    permission_classes = [IsAuthenticated]

    LABOR_FEE = 100   # per pot
    SOIL_FEE = 250    # per pot (includes soil & fertilizer)
    TRAVEL_FREE_KM = 5
    TRAVEL_RATE = 20  # per km beyond the free radius

    def get_queryset(self):
        user = self.request.user
        qs = PottingRequest.objects.all()
        if getattr(user, 'role', '') != 'admin' and not user.is_staff:
            qs = qs.filter(user=user)
        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        pots = data.get('pots', {}) or {}
        # Accept either a {small,medium,large} dict or a plain list.
        if isinstance(pots, dict):
            count = sum(int(v or 0) for v in pots.values())
            parts = [f"{int(pots.get(k) or 0)} {label}" for k, label in
                     (('small', 'Small'), ('medium', 'Medium'), ('large', 'Large')) if int(pots.get(k) or 0) > 0]
            summary = ', '.join(parts)
        else:
            count = data.get('pot_count') or len(pots)
            summary = f"{count} pots"

        package = data.get('package_type', 'labor')
        distance = data.get('distance', 0) or 0
        per_pot = self.SOIL_FEE if package == 'soil' else self.LABOR_FEE
        service_fee = count * per_pot
        travel = max(0, distance - self.TRAVEL_FREE_KM) * self.TRAVEL_RATE
        serializer.save(
            user=self.request.user,
            pot_count=count,
            pots_summary=summary,
            service_fee=service_fee,
            travel_charge=travel,
            total_bill=service_fee + travel,
            status='requested',
        )

    @action(detail=True, methods=['post'])
    def advance_status(self, request, pk=None):
        user = request.user
        if getattr(user, 'role', '') != 'admin' and not user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        req = self.get_object()
        stages = ['requested', 'scheduled', 'in_progress', 'completed']
        try:
            idx = stages.index(req.status)
        except ValueError:
            idx = 0
        if idx < len(stages) - 1:
            req.status = stages[idx + 1]
        req.save()
        return Response(self.get_serializer(req).data)

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Admin/staff set an arbitrary status and optionally assign an expert."""
        user = request.user
        if getattr(user, 'role', '') != 'admin' and not user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        req = self.get_object()
        valid = {c[0] for c in PottingRequest.STATUS_CHOICES}
        new_status = request.data.get('status')
        if new_status in valid:
            req.status = new_status
        expert = request.data.get('assigned_expert')
        if expert:
            req.assigned_expert = expert
        req.save()
        return Response(self.get_serializer(req).data)
