# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Utilisateur

@receiver(post_save, sender=Utilisateur)
def auto_validate_chauffeurs(sender, instance, created, **kwargs):
    """Valider automatiquement les chauffeurs à l'inscription"""
    if created and instance.role == Utilisateur.Role.CHAUFFEUR:
        instance.statut = Utilisateur.StatutUtilisateur.ACTIF
        instance.save(update_fields=['statut'])

@receiver(post_save, sender=Utilisateur)
def assign_admin_role(sender, instance, created, **kwargs):
    """Assigner le rôle ADMIN aux superusers"""
    if instance.is_superuser and instance.role != Utilisateur.Role.ADMIN:
        instance.role = Utilisateur.Role.ADMIN
        instance.save(update_fields=['role'])