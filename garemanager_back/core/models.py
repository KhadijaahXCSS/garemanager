# models.py - Version corrigée
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrateur')
        GESTIONNAIRE = 'GESTIONNAIRE', _('Gestionnaire de gare')
        CHAUFFEUR = 'CHAUFFEUR', _('Chauffeur')
    
    class StatutUtilisateur(models.TextChoices):
        ACTIF = 'ACTIF', _('Actif')
        EN_ATTENTE = 'EN_ATTENTE', _('En attente')
        SUSPENDU = 'SUSPENDU', _('Suspendu')
        DESACTIVE = 'DESACTIVE', _('Désactivé')

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CHAUFFEUR)
    statut = models.CharField(max_length=20, choices=StatutUtilisateur.choices, default=StatutUtilisateur.EN_ATTENTE)
    CIN = models.CharField(max_length=20, unique=True, blank=True, null=True)
    telephone = models.CharField(max_length=15, blank=True)
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    raison_suspension = models.TextField(blank=True)
    date_suspension = models.DateTimeField(null=True, blank=True)

class Gare(models.Model):
    gare_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    localisation = models.CharField(max_length=200)
    capacite_max = models.IntegerField()
    gestionnaire = models.ForeignKey(
        Utilisateur, 
        on_delete=models.SET_NULL, 
        null=True, 
        limit_choices_to={'role': Utilisateur.Role.GESTIONNAIRE}
    )

class Vehicule(models.Model):
    class TypeVehicule(models.TextChoices):
        NDIAGA = 'NDIAGA', _('Ndiaga Ndiaye')
        CLANDO = 'CLANDO', _('Clando')
        MINI_CAR = 'MINI_CAR', _('Mini-car')

    vehicule_id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    immatricule = models.CharField(max_length=20, unique=True)
    type = models.CharField(max_length=10, choices=TypeVehicule.choices)
    chauffeur = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE,
        limit_choices_to={'role': Utilisateur.Role.CHAUFFEUR}
    )
    date_enregistrement = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['immatricule'], name='immatricule_unique')
        ]

class FileAttente(models.Model):
    class StatutFile(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', _('En attente')
        EN_COURS = 'EN_COURS', _('En cours d\'embarquement')
        PARTI = 'PARTI', _('Parti')

    file_id = models.UUIDField(primary_key=True, editable=False,default=uuid.uuid4)
    vehicule = models.ForeignKey(Vehicule, on_delete=models.CASCADE)
    gare = models.ForeignKey(Gare, on_delete=models.CASCADE)
    position = models.IntegerField()
    statut = models.CharField(max_length=20, choices=StatutFile.choices, default=StatutFile.EN_ATTENTE)
    heure_arrivee = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position']

class Notification(models.Model):
    class TypeNotification(models.TextChoices):
        DEPART = 'DEPART', _('Notification de départ')
        CONFLIT = 'CONFLIT', _('Résolution de conflit')
        RETARD = 'RETARD', _('Alerte retard')
        SYSTEME = 'SYSTEME', _('Notification système')

    notif_id = models.UUIDField(primary_key=True, editable=False,default=uuid.uuid4)
    user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TypeNotification.choices)
    est_lue = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)

class Statistique(models.Model):
    stat_id = models.UUIDField(primary_key=True, editable=False,default=uuid.uuid4)
    gare = models.ForeignKey(Gare, on_delete=models.CASCADE)
    date = models.DateField()
    nb_vehicules = models.IntegerField()
    nb_passagers = models.IntegerField()
    heure_pointe = models.TimeField()

class DemandeAcces(models.Model):
    class StatutDemande(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', _('En attente')
        ACCEPTEE = 'ACCEPTEE', _('Acceptée')
        REFUSEE = 'REFUSEE', _('Refusée')
    
    demande_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chauffeur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    gare = models.ForeignKey(Gare, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=StatutDemande.choices, default=StatutDemande.EN_ATTENTE)
    date_demande = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['chauffeur', 'gare']

class Evaluation(models.Model):
    eval_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chauffeur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    note = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaire = models.TextField(blank=True)
    date_evaluation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_evaluation']

class Reclamation(models.Model):
    class TypeReclamation(models.TextChoices):
        CONFLIT = 'CONFLIT', _('Conflit entre chauffeurs')
        SERVICE = 'SERVICE', _('Problème de service')
        COMPORTEMENT = 'COMPORTEMENT', _('Mauvais comportement')
        TECHNIQUE = 'TECHNIQUE', _('Problème technique')
        AUTRE = 'AUTRE', _('Autre')

    class StatutReclamation(models.TextChoices):
        OUVERTE = 'OUVERTE', _('Ouverte')
        EN_COURS = 'EN_COURS', _('En cours de traitement')
        RESOLUE = 'RESOLUE', _('Résolue')
        FERMEE = 'FERMEE', _('Fermée')

    reclamation_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chauffeur = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': Utilisateur.Role.CHAUFFEUR}
    )
    gare = models.ForeignKey(Gare, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=TypeReclamation.choices)
    titre = models.CharField(max_length=200)
    description = models.TextField()
    statut = models.CharField(max_length=20, choices=StatutReclamation.choices, default=StatutReclamation.OUVERTE)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    traite_par = models.ForeignKey(
        Utilisateur, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reclamations_traitees'
    )