# core/admin_dashboard.py
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
from .models import Utilisateur, Gare, Vehicule, FileAttente, Reclamation, DemandeAcces

class AdminDashboard:
    def __init__(self, request):
        self.request = request
        self.now = timezone.now()

    def get_statistiques_globales(self):
        """Récupérer les statistiques globales de la plateforme"""
        total_utilisateurs = Utilisateur.objects.count()
        total_gares = Gare.objects.count()
        total_vehicules = Vehicule.objects.count()
        total_reclamations = Reclamation.objects.count()
        reclamations_ouvertes = Reclamation.objects.filter(
            statut__in=['OUVERTE', 'EN_COURS']
        ).count()
        gestionnaires_en_attente = Utilisateur.objects.filter(
            role='GESTIONNAIRE',
            statut='EN_ATTENTE'
        ).count()

        return {
            'total_utilisateurs': total_utilisateurs,
            'total_gares': total_gares,
            'total_vehicules': total_vehicules,
            'total_reclamations': total_reclamations,
            'reclamations_ouvertes': reclamations_ouvertes,
            'utilisateurs_en_attente': gestionnaires_en_attente # ⚠️ Seulement les gestionnaires
        }

    def get_utilisateurs_en_attente(self):
        """Récupérer uniquement les GESTIONNAIRES en attente de validation"""
        return Utilisateur.objects.filter(
            role='GESTIONNAIRE',  # ⚠️ Seulement les gestionnaires
            statut='EN_ATTENTE'
        ).order_by('-date_inscription')[:10]
    
    def get_utilisateurs_suspendus(self):
        """Récupérer les utilisateurs suspendus"""
        return Utilisateur.objects.filter(
            statut='SUSPENDU'
        ).order_by('-date_suspension')[:10]

    def get_reclamations_recentes(self):
        """Récupérer les réclamations récentes"""
        return Reclamation.objects.all().order_by('-date_creation')[:10]

    def get_activite_recente(self):
        """Récupérer l'activité récente de la plateforme"""
        date_limite = self.now - timedelta(days=7)  # Activité des 7 derniers jours
        
        nouvelles_inscriptions = Utilisateur.objects.filter(
            date_inscription__gte=date_limite
        ).order_by('-date_inscription')[:5]
        
        nouvelles_reclamations = Reclamation.objects.filter(
            date_creation__gte=date_limite
        ).order_by('-date_creation')[:5]
        
        nouveaux_vehicules = Vehicule.objects.filter(
            date_enregistrement__gte=date_limite
        ).order_by('-date_enregistrement')[:5]

        return {
            'nouvelles_inscriptions': nouvelles_inscriptions,
            'nouvelles_reclamations': nouvelles_reclamations,
            'nouveaux_vehicules': nouveaux_vehicules
        }

    def get_statistiques_gares(self):
        """Récupérer les statistiques par gare"""
        gares = Gare.objects.all()
        statistiques_gares = []
        
        for gare in gares:
            # Compter les véhicules actuellement dans la gare
            vehicules_actuels = FileAttente.objects.filter(
                gare=gare,
                statut__in=['EN_ATTENTE', 'EN_COURS']
            ).count()
            
            # Compter les demandes d'accès en attente
            demandes_en_attente = DemandeAcces.objects.filter(
                gare=gare,
                statut='EN_ATTENTE'
            ).count()
            
            # Compter les réclamations pour cette gare
            reclamations_gare = Reclamation.objects.filter(gare=gare).count()
            
            statistiques_gares.append({
                'gare_id': str(gare.gare_id),
                'nom': gare.nom,
                'localisation': gare.localisation,
                'capacite_max': gare.capacite_max,
                'vehicules_actuels': vehicules_actuels,
                'places_disponibles': max(0, gare.capacite_max - vehicules_actuels),
                'demandes_en_attente': demandes_en_attente,
                'reclamations': reclamations_gare,
                'taux_occupation': round((vehicules_actuels / gare.capacite_max) * 100, 1) if gare.capacite_max > 0 else 0
            })
        
        return statistiques_gares

    # Méthodes supplémentaires pour les graphiques
    def get_inscriptions_par_role(self):
        """Nombre d'inscriptions par rôle"""
        return Utilisateur.objects.values('role').annotate(
            count=Count('id')
        ).order_by('role')

    def get_reclamations_par_type(self):
        """Nombre de réclamations par type"""
        return Reclamation.objects.values('type').annotate(
            count=Count('id')
        ).order_by('type')

    def get_vehicules_par_type(self):
        """Nombre de véhicules par type"""
        return Vehicule.objects.values('type').annotate(
            count=Count('id')
        ).order_by('type')