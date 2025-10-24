from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Avg,Count
from django.utils import timezone



from datetime import timedelta

from .models import Utilisateur, Gare, Vehicule, FileAttente, Notification, Statistique, DemandeAcces, Evaluation, Reclamation
from .serializers import (
    UtilisateurSerializer,
    GareSerializer,
    VehiculeSerializer,
    FileAttenteSerializer,
    NotificationSerializer,
    ReclamationSerializer,
    StatistiqueSerializer
)
from .permissions import IsAdmin, IsAdminOrGestionnaire, IsAdminOrSelf, IsGestionnaireGare, IsOwnerOrAdmin

from .admin_dashboard import AdminDashboard

class UtilisateurViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les utilisateurs
    - Inscription publique (POST)
    - Lecture/modification: Admin seulement
    """
    queryset = Utilisateur.objects.all().order_by('-date_inscription')
    serializer_class = UtilisateurSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]  # Inscription publique
        return [IsAdmin()]  # Autres actions réservées à l'admin

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        
        if role is not None:
            queryset = queryset.filter(role=role)
            
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def gestionnaires(self, request):
        """Récupérer uniquement les gestionnaires de gare"""
        gestionnaires = Utilisateur.objects.filter(role='GESTIONNAIRE')
        serializer = self.get_serializer(gestionnaires, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def chauffeurs(self, request):
        """Récupérer uniquement les chauffeurs"""
        chauffeurs = Utilisateur.objects.filter(role='CHAUFFEUR')
        serializer = self.get_serializer(chauffeurs, many=True)
        return Response(serializer.data)

class GareViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les gares routières
    - Admin: accès complet
    - Gestionnaire: accès seulement à sa gare
    """
    queryset = Gare.objects.all()
    serializer_class = GareSerializer
    permission_classes = [IsAdminOrGestionnaire]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.role == 'GESTIONNAIRE':
            return queryset.filter(gestionnaire=self.request.user)
        
        gestionnaire_id = self.request.query_params.get('gestionnaire', None)
        if gestionnaire_id is not None:
            queryset = queryset.filter(gestionnaire__id=gestionnaire_id)
            
        return queryset

    def perform_create(self, serializer):
        """Seul l'admin peut créer une gare"""
        if self.request.user.role != 'ADMIN':
            raise serializers.ValidationError("Seul l'administrateur peut créer une gare")
        serializer.save()


    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def demande_acces(self, request, pk=None):
        """Récupérer le statut de la demande d'accès pour la gare"""
        gare = self.get_object()
        chauffeur = request.user
        
        if chauffeur.role != 'CHAUFFEUR':
            return Response(
                {"error": "Accès réservé aux chauffeurs"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        demande = DemandeAcces.objects.filter(
            chauffeur=chauffeur,
            gare=gare
        ).first()
        
        if demande:
            return Response({"statut": demande.statut})
        else:
            return Response({"statut": "NON_DEMANDE"})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def gares_avec_disponibilite(self, request):
        """Récupérer toutes les gares avec leur statut de disponibilité"""
        gares = Gare.objects.all()
        gares_data = []
        
        for gare in gares:
            # Compter le nombre de véhicules actuellement dans la gare
            vehicules_dans_gare = FileAttente.objects.filter(
                gare=gare,
                statut__in=['EN_ATTENTE', 'EN_COURS']
            ).count()
            
            # Calculer la disponibilité
            places_disponibles = gare.capacite_max - vehicules_dans_gare
            est_disponible = places_disponibles > 0
            
            gares_data.append({
                'gare_id': str(gare.gare_id),
                'nom': gare.nom,
                'localisation': gare.localisation,
                'capacite_max': gare.capacite_max,
                'vehicules_actuels': vehicules_dans_gare,
                'places_disponibles': places_disponibles,
                'est_disponible': est_disponible
            })
        
        return Response(gares_data)
    
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def chauffeur_performance(request):
    """Endpoint pour les performances du chauffeur"""
    if request.user.role != 'CHAUFFEUR':
        return Response(
            {"error": "Accès réservé aux chauffeurs"},
            status=status.HTTP_403_FORBIDDEN
        )
    # Calculer la note moyenne
    evaluations = Evaluation.objects.filter(chauffeur=request.user)
    note_moyenne = evaluations.aggregate(avg_note=Avg('note'))['avg_note'] or 0
    
    # Compter les voyages (approximation basée sur les files d'attente)
    total_voyages = FileAttente.objects.filter(
        vehicule__chauffeur=request.user,
        statut='PARTI'
    ).count()
    
    performance_data = {
        'note_moyenne': round(note_moyenne, 1),
        'total_voyages': total_voyages,
        'appreciation': 'Très professionnel' if note_moyenne >= 4 else 'Satisfaisant' if note_moyenne >= 3 else 'À améliorer',
        'bonnes_conduites': 0,  # À implémenter selon votre logique métier
        'problemes_resolus': 0  # À implémenter selon votre logique métier
    }
    
    return Response(performance_data)

class VehiculeViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les véhicules
    - Admin: accès complet
    - Gestionnaire: véhicules de sa gare
    - Chauffeur: seulement ses véhicules
    """
    queryset = Vehicule.objects.all().order_by('-date_enregistrement')
    serializer_class = VehiculeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.role == 'CHAUFFEUR':
            return queryset.filter(chauffeur=self.request.user)
        
        elif self.request.user.role == 'GESTIONNAIRE':
            # Les gestionnaires voient les véhicules de leur gare
            return queryset.filter(fileattente__gare__gestionnaire=self.request.user).distinct()
        
        # Filtres pour l'admin
        type_vehicule = self.request.query_params.get('type', None)
        chauffeur_id = self.request.query_params.get('chauffeur', None)
        
        if type_vehicule is not None:
            queryset = queryset.filter(type=type_vehicule)
        if chauffeur_id is not None:
            queryset = queryset.filter(chauffeur__id=chauffeur_id)
            
        return queryset

    def perform_create(self, serializer):
        """Validation et création d'un véhicule"""
        chauffeur = self.request.user
        
        # Vérifier que l'utilisateur est un chauffeur
        if chauffeur.role != 'CHAUFFEUR':
            raise serializers.ValidationError(
                {"error": "Seuls les chauffeurs peuvent déclarer des véhicules"}
            )
        
        # Limiter à 3 véhicules par chauffeur
        vehicules_existants = Vehicule.objects.filter(chauffeur=chauffeur).count()
        if vehicules_existants >= 3:
            raise serializers.ValidationError(
                {"error": "Vous ne pouvez pas déclarer plus de 3 véhicules"}
            )
        
        # Vérifier l'immatriculation unique
        immatricule = serializer.validated_data['immatricule']
        if Vehicule.objects.filter(immatricule__iexact=immatricule).exists():
            raise serializers.ValidationError(
                {"immatricule": "Ce numéro d'immatriculation existe déjà"}
            )
        
        # Sauvegarder avec le chauffeur connecté
        serializer.save(chauffeur=chauffeur)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mes_vehicules(self, request):
        """Endpoint spécifique pour récupérer les véhicules du chauffeur connecté"""
        if request.user.role != 'CHAUFFEUR':
            return Response(
                {"error": "Accès réservé aux chauffeurs"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        vehicules = Vehicule.objects.filter(chauffeur=request.user)
        serializer = self.get_serializer(vehicules, many=True)
        return Response(serializer.data)

class FileAttenteViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les files d'attente
    - Admin: accès complet
    - Gestionnaire: files de sa gare
    - Chauffeur: seulement sa position
    """
    queryset = FileAttente.objects.all().order_by('position')
    serializer_class = FileAttenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.role == 'CHAUFFEUR':
            return queryset.filter(vehicule__chauffeur=self.request.user)
        
        elif self.request.user.role == 'GESTIONNAIRE':
            return queryset.filter(gare__gestionnaire=self.request.user)
        
        gare_id = self.request.query_params.get('gare', None)
        statut = self.request.query_params.get('statut', None)
        vehicule_id = self.request.query_params.get('vehicule', None)
        
        if gare_id is not None:
            queryset = queryset.filter(gare__id=gare_id)
        if statut is not None:
            queryset = queryset.filter(statut=statut)
        if vehicule_id is not None:
            queryset = queryset.filter(vehicule__id=vehicule_id)
            
        return queryset

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        """Changer le statut d'un véhicule dans la file"""
        file = self.get_object()
        
        # Vérification des permissions
        if request.user.role == 'GESTIONNAIRE' and file.gare.gestionnaire != request.user:
            return Response(
                {"error": "Vous ne pouvez pas modifier cette file d'attente"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        nouveau_statut = request.data.get('statut', None)
        
        if nouveau_statut not in dict(FileAttente.StatutFile.choices):
            return Response(
                {"error": "Statut invalide"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        file.statut = nouveau_statut
        file.save()
        return Response({"status": "Statut mis à jour"})

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les notifications
    Chaque utilisateur voit seulement ses notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-date_envoi')

    def perform_create(self, serializer):
        """Auto-assigner l'utilisateur connecté"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def non_lues(self, request):
        """Notifications non lues"""
        notifications = self.get_queryset().filter(est_lue=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def marquer_comme_lue(self, request, pk=None):
        """Marquer une notification comme lue"""
        notification = self.get_object()
        notification.est_lue = True
        notification.save()
        return Response({"status": "Notification marquée comme lue"})

class StatistiqueViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les statistiques
    - Admin: accès complet
    - Gestionnaire: statistiques de sa gare
    """
    queryset = Statistique.objects.all().order_by('-date')
    serializer_class = StatistiqueSerializer
    permission_classes = [IsAdminOrGestionnaire]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.role == 'GESTIONNAIRE':
            return queryset.filter(gare__gestionnaire=self.request.user)
        
        gare_id = self.request.query_params.get('gare', None)
        date = self.request.query_params.get('date', None)
        
        if gare_id is not None:
            queryset = queryset.filter(gare__id=gare_id)
        if date is not None:
            queryset = queryset.filter(date=date)
            
        return queryset
    
class ChauffeurGareViewSet(viewsets.ViewSet):
        permission_classes = [permissions.IsAuthenticated]
        
        @action(detail=True, methods=['post'])
        def demander_acces(self, request, pk=None):
            """Demander l'accès à une gare"""
            gare = get_object_or_404(Gare, pk=pk)
            chauffeur = request.user
            
            # Vérifier si le chauffeur a déjà fait une demande
            demande_existante = DemandeAcces.objects.filter(
                chauffeur=chauffeur,
                gare=gare
            ).exists()
            
            if demande_existante:
                return Response(
                    {"error": "Vous avez déjà fait une demande pour cette gare"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Créer la demande
            demande = DemandeAcces.objects.create(
                chauffeur=chauffeur,
                gare=gare,
                statut='EN_ATTENTE'
            )
            
            return Response({"message": "Demande envoyée avec succès", "demande_id": demande.id})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mes_gares(request):
    """Récupérer toutes les gares avec le statut de demande du chauffeur connecté"""
    if request.user.role != 'CHAUFFEUR':
        return Response(
            {"error": "Accès réservé aux chauffeurs"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer toutes les gares
    toutes_les_gares = Gare.objects.all()
    gares_data = []
    
    for gare in toutes_les_gares:
        # Vérifier le statut de demande pour cette gare
        demande = DemandeAcces.objects.filter(
            chauffeur=request.user,
            gare=gare
        ).first()
        
        statut_demande = demande.statut if demande else 'NON_DEMANDE'
        
        gares_data.append({
            'gare_id': str(gare.gare_id),
            'nom': gare.nom,
            'localisation': gare.localisation,
            'statut_demande': statut_demande,
            'date_demande': demande.date_demande if demande else None,
            'date_traitement': demande.date_traitement if demande else None
        })
    
    return Response(gares_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mes_demandes_acces(request):
    """Récupérer toutes les demandes d'accès du chauffeur connecté"""
    if request.user.role != 'CHAUFFEUR':
        return Response(
            {"error": "Accès réservé aux chauffeurs"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    demandes = DemandeAcces.objects.filter(chauffeur=request.user)
    demandes_data = []
    
    for demande in demandes:
        demandes_data.append({
            'gare_id': str(demande.gare.gare_id),
            'nom': demande.gare.nom,
            'localisation': demande.gare.localisation,
            'statut_demande': demande.statut,
            'date_demande': demande.date_demande,
            'date_traitement': demande.date_traitement
        })
    
    return Response(demandes_data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def retirer_demande_acces(request, gare_id):
    """Retirer une demande d'accès"""
    if request.user.role != 'CHAUFFEUR':
        return Response(
            {"error": "Accès réservé aux chauffeurs"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        demande = DemandeAcces.objects.get(
            chauffeur=request.user,
            gare_id=gare_id,
            statut='EN_ATTENTE'
        )
        demande.delete()
        return Response({"message": "Demande retirée avec succès"})
    except DemandeAcces.DoesNotExist:
        return Response(
            {"error": "Demande non trouvée ou déjà traitée"},
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def quitter_gare(request, gare_id):
    """Quitter une gare après 3 mois de travail"""
    if request.user.role != 'CHAUFFEUR':
        return Response(
            {"error": "Accès réservé aux chauffeurs"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        demande = DemandeAcces.objects.get(
            chauffeur=request.user,
            gare_id=gare_id,
            statut='ACCEPTEE'
        )
        
        # Vérifier si le chauffeur est dans la gare depuis au moins 3 mois
        duree_membership = timezone.now() - demande.date_traitement
        if duree_membership.days < 90:  # 3 mois = 90 jours
            return Response(
                {"error": "Vous devez être membre de cette gare depuis au moins 3 mois pour pouvoir la quitter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Supprimer la demande d'accès
        demande.delete()
        
        return Response({"message": "Vous avez quitté la gare avec succès"})
        
    except DemandeAcces.DoesNotExist:
        return Response(
            {"error": "Gare non trouvée ou accès non autorisé"},
            status=status.HTTP_404_NOT_FOUND
        )



class ReclamationViewSet(viewsets.ModelViewSet):
    """Gestion des réclamations"""
    queryset = Reclamation.objects.all().order_by('-date_creation')
    serializer_class = ReclamationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.role == 'CHAUFFEUR':
            return queryset.filter(chauffeur=self.request.user)
        elif self.request.user.role == 'GESTIONNAIRE':
            return queryset.filter(gare__gestionnaire=self.request.user)
        
        # Admin voit toutes les réclamations
        statut = self.request.query_params.get('statut', None)
        if statut is not None:
            queryset = queryset.filter(statut=statut)
            
        return queryset

    def perform_create(self, serializer):
        """Création d'une réclamation (uniquement pour les chauffeurs)"""
        if self.request.user.role != 'CHAUFFEUR':
            raise serializers.ValidationError(
                {"error": "Seuls les chauffeurs peuvent créer des réclamations"}
            )
        serializer.save(chauffeur=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrGestionnaire])
    def traiter(self, request, pk=None):
        """Traiter une réclamation"""
        reclamation = self.get_object()
        nouveau_statut = request.data.get('statut', 'EN_COURS')
        commentaire = request.data.get('commentaire', '')
        
        if nouveau_statut not in dict(Reclamation.StatutReclamation.choices):
            return Response(
                {"error": "Statut invalide"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reclamation.statut = nouveau_statut
        reclamation.traite_par = request.user
        
        if commentaire:
            # Ajouter un commentaire au message existant
            reclamation.description += f"\n\n--- Traitement par {request.user.username} ---\n{commentaire}"
        
        reclamation.save()
        
        # Notifier le chauffeur
        Notification.objects.create(
            user=reclamation.chauffeur,
            type='SYSTEME',
            message=f"Votre réclamation '{reclamation.titre}' a été mise à jour. Statut: {reclamation.get_statut_display()}"
        )
        
        return Response({"message": "Réclamation traitée avec succès"})
    


class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]
    
    def list(self, request):
        """Endpoint principal du dashboard admin"""
        dashboard = AdminDashboard(request)
        
        data = {
            'statistiques_globales': dashboard.get_statistiques_globales(),
            'utilisateurs_en_attente': UtilisateurSerializer(
                dashboard.get_utilisateurs_en_attente(), 
                many=True
            ).data,
            'utilisateurs_suspendus': UtilisateurSerializer(
                dashboard.get_utilisateurs_suspendus(), 
                many=True
            ).data,
            'reclamations_recentes': ReclamationSerializer(
                dashboard.get_reclamations_recentes(), 
                many=True
            ).data,
            'activite_recente': self._serialize_activite_recente(dashboard.get_activite_recente()),
            'statistiques_gares': dashboard.get_statistiques_gares()
        }
        
        return Response(data)
    
    def _serialize_activite_recente(self, activite):
        """Sérialiser l'activité récente"""
        return {
            'nouvelles_inscriptions': UtilisateurSerializer(
                activite['nouvelles_inscriptions'], 
                many=True
            ).data,
            'nouvelles_reclamations': ReclamationSerializer(
                activite['nouvelles_reclamations'], 
                many=True
            ).data,
            'nouveaux_vehicules': VehiculeSerializer(
                activite['nouveaux_vehicules'], 
                many=True
            ).data
        }
    
    @action(detail=False, methods=['get'])
    def graphiques(self, request):
        """Données pour les graphiques du dashboard"""
        dashboard = AdminDashboard(request)
        
        # Données pour le graphique d'inscriptions sur 30 jours
        date_limite = timezone.now() - timedelta(days=30)
        inscriptions_par_jour = Utilisateur.objects.filter(
            date_inscription__gte=date_limite
        ).extra({
            'date': "DATE(date_inscription)"
        }).values('date').annotate(count=Count('id')).order_by('date')
        
        return Response({
            'inscriptions_30_jours': list(inscriptions_par_jour),
            'inscriptions_par_role': list(dashboard.get_inscriptions_par_role()),
            'reclamations_par_type': list(dashboard.get_reclamations_par_type()),
            'vehicules_par_type': list(dashboard.get_vehicules_par_type())
        })

class AdminUtilisateurViewSet(viewsets.ModelViewSet):
    """Vue spéciale pour l'administration des utilisateurs"""
    queryset = Utilisateur.objects.all().order_by('-date_inscription')
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAdmin]  # ✅ Une seule définition

    # ✅ Méthode list par défaut pour lister les utilisateurs
    def list(self, request):
        """Lister tous les utilisateurs avec filtres"""
        queryset = self.get_queryset()
        
        # Filtres optionnels
        role = request.query_params.get('role')
        statut = request.query_params.get('statut')
        
        if role:
            queryset = queryset.filter(role=role)
        if statut:
            queryset = queryset.filter(statut=statut)
            
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    @action(detail=True, methods=['post'])
    def valider_inscription(self, request, pk=None):
        """Valider l'inscription d'un GESTIONNAIRE (seulement)"""
        utilisateur = self.get_object()
        
        # Vérifier que c'est bien un gestionnaire
        if utilisateur.role != 'GESTIONNAIRE':
            return Response(
                {"error": "Seuls les gestionnaires de gare nécessitent une validation manuelle"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if utilisateur.statut != 'EN_ATTENTE':
            return Response(
                {"error": "Cet utilisateur n'est pas en attente de validation"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        utilisateur.statut = 'ACTIF'
        utilisateur.date_validation = timezone.now()
        utilisateur.save()
        
        # Notification
        Notification.objects.create(
            user=utilisateur,
            type='SYSTEME',
            message="Votre compte gestionnaire a été validé. Vous pouvez maintenant gérer votre gare."
        )
        
        return Response({"message": "Gestionnaire validé avec succès"})


    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        """Suspendre un utilisateur"""
        utilisateur = self.get_object()
        raison = request.data.get('raison', '')
        
        if utilisateur.statut == 'SUSPENDU':
            return Response(
                {"error": "Cet utilisateur est déjà suspendu"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        utilisateur.statut = 'SUSPENDU'
        utilisateur.raison_suspension = raison
        utilisateur.date_suspension = timezone.now()
        utilisateur.save()
        
        # Créer une notification pour l'utilisateur
        Notification.objects.create(
            user=utilisateur,
            type='SYSTEME',
            message=f"Votre compte a été suspendu. Raison: {raison}"
        )
        
        return Response({"message": "Utilisateur suspendu avec succès"})

    @action(detail=True, methods=['post'])
    def reactiver(self, request, pk=None):
        """Réactiver un utilisateur suspendu"""
        utilisateur = self.get_object()
        
        if utilisateur.statut != 'SUSPENDU':
            return Response(
                {"error": "Cet utilisateur n'est pas suspendu"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        utilisateur.statut = 'ACTIF'
        utilisateur.raison_suspension = ''
        utilisateur.save()
        
        # Créer une notification pour l'utilisateur
        Notification.objects.create(
            user=utilisateur,
            type='SYSTEME',
            message="Votre compte a été réactivé. Vous pouvez à nouveau utiliser la plateforme."
        )
        
        return Response({"message": "Utilisateur réactivé avec succès"})

  
    @action(detail=False, methods=['get'])
    def gestionnaires_en_attente(self, request):
        """Récupérer uniquement les gestionnaires en attente de validation"""
        gestionnaires = Utilisateur.objects.filter(
            role='GESTIONNAIRE', 
            statut='EN_ATTENTE'
        ).order_by('-date_inscription')
        
        serializer = self.get_serializer(gestionnaires, many=True)
        return Response(serializer.data)


