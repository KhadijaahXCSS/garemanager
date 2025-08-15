from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Utilisateur

@receiver(post_save, sender=Utilisateur)
def assign_admin_role(sender, instance, created, **kwargs):
   
    if instance.is_superuser and instance.role != Utilisateur.Role.ADMIN:
        instance.role = Utilisateur.Role.ADMIN
        instance.save(update_fields=['role'])