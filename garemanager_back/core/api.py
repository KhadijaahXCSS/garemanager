from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Utilisateur, Gare, Vehicule, FileAttente, Notification, Statistique
from .serializers import (
    UtilisateurSerializer,
    GareSerializer,
    VehiculeSerializer,
    FileAttenteSerializer,
    NotificationSerializer,
    StatistiqueSerializer
)
from .permissions import IsAdmin, IsAdminOrGestionnaire, IsAdminOrSelf, IsGestionnaireGare, IsOwnerOrAdmin

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

    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques d'une gare spécifique"""
        gare = self.get_object()
        
        # Vérification des permissions
        if request.user.role == 'GESTIONNAIRE' and gare.gestionnaire != request.user:
            return Response(
                {"error": "Accès non autorisé à cette gare"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = Statistique.objects.filter(gare=gare)
        serializer = StatistiqueSerializer(stats, many=True)
        return Response(serializer.data)

class VehiculeViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les véhicules
    - Admin: accès complet
    - Gestionnaire: véhicules de sa gare
    - Chauffeur: seulement son véhicule
    """
    queryset = Vehicule.objects.all().order_by('-date_enregistrement')
    serializer_class = VehiculeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.role == 'CHAUFFEUR':
            return queryset.filter(chauffeur=self.request.user)
        
        elif self.request.user.role == 'GESTIONNAIRE':
            return queryset.filter(gare__gestionnaire=self.request.user)
        
        type_vehicule = self.request.query_params.get('type', None)
        chauffeur_id = self.request.query_params.get('chauffeur', None)
        
        if type_vehicule is not None:
            queryset = queryset.filter(type=type_vehicule)
        if chauffeur_id is not None:
            queryset = queryset.filter(chauffeur__id=chauffeur_id)
            
        return queryset

    def perform_create(self, serializer):
        """Validation de l'immatriculation unique"""
        if Vehicule.objects.filter(immatricule=serializer.validated_data['immatricule']).exists():
            raise serializers.ValidationError({"immatricule": "Ce numéro d'immatriculation existe déjà"})
        serializer.save()

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