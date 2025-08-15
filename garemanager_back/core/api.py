from rest_framework import viewsets, permissions, status, serializers
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

class UtilisateurViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les utilisateurs (Admin, Gestionnaires, Chauffeurs)
    """
    queryset = Utilisateur.objects.all().order_by('-date_inscription')
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Filtrage par rôle si paramètre fourni
        """
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        
        if role is not None:
            queryset = queryset.filter(role=role)
            
        return queryset

    @action(detail=False, methods=['get'])
    def gestionnaires(self, _request):
        """
        Endpoint spécial pour récupérer uniquement les gestionnaires de gare
        """
        gestionnaires = Utilisateur.objects.filter(role='GESTIONNAIRE')
        serializer = self.get_serializer(gestionnaires, many=True)
        return Response(serializer.data)

class GareViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les gares routières
    """
    queryset = Gare.objects.all()
    serializer_class = GareSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Filtrage par gestionnaire si paramètre fourni
        """
        queryset = super().get_queryset()
        gestionnaire_id = self.request.query_params.get('gestionnaire', None)
        
        if gestionnaire_id is not None:
            queryset = queryset.filter(gestionnaire__id=gestionnaire_id)
            
        return queryset

    @action(detail=True, methods=['get'])
    def statistiques(self, _request, _pk=None):
        """
        Endpoint pour récupérer les statistiques d'une gare spécifique
        """
        gare = self.get_object()
        stats = Statistique.objects.filter(gare=gare)
        serializer = StatistiqueSerializer(stats, many=True)
        return Response(serializer.data)

class VehiculeViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les véhicules
    """
    queryset = Vehicule.objects.all().order_by('-date_enregistrement')
    serializer_class = VehiculeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Filtrage par type ou chauffeur
        """
        queryset = super().get_queryset()
        type_vehicule = self.request.query_params.get('type', None)
        chauffeur_id = self.request.query_params.get('chauffeur', None)
        
        if type_vehicule is not None:
            queryset = queryset.filter(type=type_vehicule)
        if chauffeur_id is not None:
            queryset = queryset.filter(chauffeur__id=chauffeur_id)
            
        return queryset

    def perform_create(self, serializer):
        """
        Validation supplémentaire avant création
        """
        if Vehicule.objects.filter(immatricule=serializer.validated_data['immatricule']).exists():
            raise serializers.ValidationError({"immatricule": "Ce numéro d'immatriculation existe déjà"})
        serializer.save()

class FileAttenteViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les files d'attente des gares
    """
    queryset = FileAttente.objects.all().order_by('position')
    serializer_class = FileAttenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filtrage par gare, statut ou véhicule
        """
        queryset = super().get_queryset()
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
    def changer_statut(self, request, _pk=None):
        """
        Action personnalisée pour changer le statut d'un véhicule dans la file
        """
        file = self.get_object()
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
    """
    queryset = Notification.objects.all().order_by('-date_envoi')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Ne montre que les notifications de l'utilisateur connecté
        """
        queryset = super().get_queryset()
        return queryset.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def non_lues(self, _request):
        """
        Endpoint pour récupérer les notifications non lues
        """
        notifications = self.get_queryset().filter(est_lue=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def marquer_comme_lue(self, _request, _pk=None):
        """
        Marquer une notification spécifique comme lue
        """
        notification = self.get_object()
        notification.est_lue = True
        notification.save()
        return Response({"status": "Notification marquée comme lue"})

class StatistiqueViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les statistiques des gares
    """
    queryset = Statistique.objects.all().order_by('-date')
    serializer_class = StatistiqueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filtrage par gare ou date
        """
        queryset = super().get_queryset()
        gare_id = self.request.query_params.get('gare', None)
        date = self.request.query_params.get('date', None)
        
        if gare_id is not None:
            queryset = queryset.filter(gare__id=gare_id)
        if date is not None:
            queryset = queryset.filter(date=date)
            
        return queryset