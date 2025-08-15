from rest_framework import serializers
from .models import Utilisateur, Gare, Vehicule, FileAttente, Notification, Statistique

class UtilisateurSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    CIN = serializers.CharField(max_length=20, allow_blank=True, required=False)
    telephone = serializers.CharField(max_length=15, allow_blank=True, required=False)
    role = serializers.ChoiceField(
        choices=[('ADMIN', 'Administrateur'), 
                ('GESTIONNAIRE', 'Gestionnaire de gare'), 
                ('CHAUFFEUR', 'Chauffeur')],
        default='CHAUFFEUR'
    )
    date_inscription = serializers.DateTimeField(read_only=True)
    is_staff = serializers.BooleanField(default=False)

    def create(self, validated_data):
        return Utilisateur.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.CIN = validated_data.get('CIN', instance.CIN)
        instance.telephone = validated_data.get('telephone', instance.telephone)
        instance.role = validated_data.get('role', instance.role)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        instance.save()
        return instance

class GareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gare
        fields = ['gare_id', 'nom', 'localisation', 'capacite_max', 'gestionnaire']
        extra_kwargs = {
            'gare_id': {'read_only': True}
        }

    def create(self, validated_data):
        return Gare.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.nom = validated_data.get('nom', instance.nom)
        instance.localisation = validated_data.get('localisation', instance.localisation)
        instance.capacite_max = validated_data.get('capacite_max', instance.capacite_max)
        instance.gestionnaire = validated_data.get('gestionnaire', instance.gestionnaire)
        instance.save()
        return instance

class VehiculeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicule
        fields = ['vehicule_id', 'immatricule', 'type', 'chauffeur', 'date_enregistrement']
        extra_kwargs = {
            'vehicule_id': {'read_only': True},
            'date_enregistrement': {'read_only': True}
        }

    def validate_immatricule(self, value):
        if Vehicule.objects.filter(immatricule=value).exists():
            raise serializers.ValidationError("Un véhicule avec cette immatriculation existe déjà")
        return value

class FileAttenteSerializer(serializers.ModelSerializer):
    vehicule_detail = serializers.SerializerMethodField()
    gare_detail = serializers.SerializerMethodField()

    class Meta:
        model = FileAttente
        fields = ['file_id', 'vehicule', 'vehicule_detail', 'gare', 'gare_detail', 
                 'position', 'statut', 'heure_arrivee']
        extra_kwargs = {
            'file_id': {'read_only': True},
            'heure_arrivee': {'read_only': True}
        }

    def get_vehicule_detail(self, obj):
        return {
            'immatricule': obj.vehicule.immatricule,
            'type': obj.vehicule.type,
            'chauffeur': obj.vehicule.chauffeur.username
        }

    def get_gare_detail(self, obj):
        return {
            'nom': obj.gare.nom,
            'localisation': obj.gare.localisation
        }

class NotificationSerializer(serializers.ModelSerializer):
    user_detail = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['notif_id', 'user', 'user_detail', 'message', 'type', 'est_lue', 'date_envoi']
        extra_kwargs = {
            'notif_id': {'read_only': True},
            'date_envoi': {'read_only': True}
        }

    def get_user_detail(self, obj):
        return {
            'username': obj.user.username,
            'role': obj.user.role
        }

class StatistiqueSerializer(serializers.ModelSerializer):
    gare_detail = serializers.SerializerMethodField()

    class Meta:
        model = Statistique
        fields = ['stat_id', 'gare', 'gare_detail', 'date', 'nb_vehicules', 
                 'nb_passagers', 'heure_pointe']
        extra_kwargs = {
            'stat_id': {'read_only': True}
        }

    def get_gare_detail(self, obj):
        return {
            'nom': obj.gare.nom,
            'localisation': obj.gare.localisation
        }