from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid



# Create your models here.



class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrateur')
        GESTIONNAIRE = 'GESTIONNAIRE', _('Gestionnaire de gare')
        CHAUFFEUR = 'CHAUFFEUR', _('Chauffeur')

    # Champs de base (hérités d'AbstractUser : username, password, email, etc.)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CHAUFFEUR)
    CIN = models.CharField(max_length=20, unique=True, blank=True, null=True)
    telephone = models.CharField(max_length=15, blank=True)
    date_inscription = models.DateTimeField(auto_now_add=True)

    # Relations spécifiques aux rôles (optionnel)
    def is_gestionnaire(self):
        return self.role == self.Role.GESTIONNAIRE

    def is_chauffeur(self):
        return self.role == self.Role.CHAUFFEUR
    #  pour utiliser le décorateur @admin.action ou has_perm() dans les vues pour restreindre les actions.
    class Meta:
        permissions = [
            ("gerer_gare", "Peut gérer une gare (Gestionnaire)"),
            ("consulter_file", "Peut consulter la file (Chauffeur)"),
        ]

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
    chauffeur = models.OneToOneField(
        Utilisateur, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': Utilisateur.Role.CHAUFFEUR}
    )
    date_enregistrement = models.DateTimeField(auto_now_add=True)

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
        ordering = ['position']  # Trie par défaut par position

class Notification(models.Model):
    class TypeNotification(models.TextChoices):
        DEPART = 'DEPART', _('Notification de départ')
        CONFLIT = 'CONFLIT', _('Résolution de conflit')
        RETARD = 'RETARD', _('Alerte retard')

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

