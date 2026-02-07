from django.db import models

class PlantCategory(models.Model):
    name = models.CharField(max_length=100)
    image_url = models.URLField(blank=True, null=True, help_text="URL for category cover image")

    class Meta:
        verbose_name_plural = "Plant Categories"

    def __str__(self):
        return self.name

class PlantVariety(models.Model):
    category = models.ForeignKey(PlantCategory, related_name='varieties', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    care_instructions = models.TextField(help_text="Detailed care instructions (Light, Water, Soil, etc.)")
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Plant Varieties"

    def __str__(self):
        return self.name
