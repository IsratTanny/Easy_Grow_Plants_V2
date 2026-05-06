# Generated manually
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0014_exchangepost_exchangeproposal'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameField(
            model_name='exchangeproposal',
            old_name='post',
            new_name='plant',
        ),
        migrations.RenameField(
            model_name='exchangeproposal',
            old_name='user',
            new_name='sender',
        ),
        migrations.AlterField(
            model_name='exchangeproposal',
            name='sender',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_proposals', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='exchangeproposal',
            name='receiver',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='received_proposals', to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
    ]
