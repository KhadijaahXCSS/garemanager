from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Utilisateur, Gare, Vehicule, FileAttente, Notification, Statistique, Reclamation


class UtilisateurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'CIN', 'telephone', 'role', 'statut', 'statut_display', 
            'date_inscription', 'date_validation', 'raison_suspension', 
            'date_suspension', 'is_staff'
        ]
        read_only_fields = ['id', 'date_inscription', 'is_staff', 'date_validation', 'date_suspension']

    def create(self, validated_data):
        """Surcharge de la création pour gérer le statut automatiquement"""
        password = validated_data.pop('password')
        role = validated_data.get('role', Utilisateur.Role.CHAUFFEUR)
        
        # Définir le statut selon le rôle
        if role == Utilisateur.Role.GESTIONNAIRE:
            validated_data['statut'] = Utilisateur.StatutUtilisateur.EN_ATTENTE
        else:  # CHAUFFEUR ou ADMIN
            validated_data['statut'] = Utilisateur.StatutUtilisateur.ACTIF
        
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()
        return user


class GareSerializer(serializers.ModelSerializer):
    gestionnaire_detail = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Gare
        fields = [
            'gare_id', 'nom', 'localisation', 'capacite_max', 
            'gestionnaire', 'gestionnaire_detail'
        ]
        read_only_fields = ['gare_id']

    def get_gestionnaire_detail(self, obj):
        if obj.gestionnaire:
            return {
                'id': obj.gestionnaire.id,
                'username': obj.gestionnaire.username,
                'email': obj.gestionnaire.email
            }
        return None

    def validate_nom(self, value):
        if self.instance and Gare.objects.exclude(pk=self.instance.pk).filter(nom__iexact=value).exists():
            raise serializers.ValidationError("Une gare avec ce nom existe déjà.")
        elif not self.instance and Gare.objects.filter(nom__iexact=value).exists():
            raise serializers.ValidationError("Une gare avec ce nom existe déjà.")
        return value

class VehiculeSerializer(serializers.ModelSerializer):
    chauffeur_detail = serializers.SerializerMethodField(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Vehicule
        fields = [
            'vehicule_id', 'immatricule', 'type', 'type_display',
            'chauffeur', 'chauffeur_detail', 'date_enregistrement'
        ]
        read_only_fields = ['vehicule_id', 'date_enregistrement', 'chauffeur_detail', 'chauffeur']  # Ajoutez 'chauffeur' ici

    def get_chauffeur_detail(self, obj):
        return {
            'id': obj.chauffeur.id,
            'username': obj.chauffeur.username,
            'CIN': obj.chauffeur.CIN,
            'telephone': obj.chauffeur.telephone
        }

    def validate_immatricule(self, value):
        value = value.upper().strip()  # Normalisation
        if self.instance and Vehicule.objects.exclude(pk=self.instance.pk).filter(immatricule__iexact=value).exists():
            raise serializers.ValidationError("Un véhicule avec cette immatriculation existe déjà.")
        elif not self.instance and Vehicule.objects.filter(immatricule__iexact=value).exists():
            raise serializers.ValidationError("Un véhicule avec cette immatriculation existe déjà.")
        return value
    
    

class FileAttenteSerializer(serializers.ModelSerializer):
    vehicule_detail = serializers.SerializerMethodField(read_only=True)
    gare_detail = serializers.SerializerMethodField(read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = FileAttente
        fields = [
            'file_id', 'vehicule', 'vehicule_detail', 'gare', 'gare_detail',
            'position', 'statut', 'statut_display', 'heure_arrivee'
        ]
        read_only_fields = ['file_id', 'heure_arrivee']

    def get_vehicule_detail(self, obj):
        return {
            'immatricule': obj.vehicule.immatricule,
            'type': obj.vehicule.type,
            'chauffeur_username': obj.vehicule.chauffeur.username,
            'chauffeur_id': obj.vehicule.chauffeur.id
        }

    def get_gare_detail(self, obj):
        return {
            'nom': obj.gare.nom,
            'localisation': obj.gare.localisation,
            'gestionnaire_id': obj.gare.gestionnaire.id if obj.gare.gestionnaire else None
        }

    def validate_position(self, value):
        if value < 1:
            raise serializers.ValidationError("La position doit être supérieure à 0.")
        return value

class NotificationSerializer(serializers.ModelSerializer):
    user_detail = serializers.SerializerMethodField(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    date_envoi_formatted = serializers.DateTimeField(
        source='date_envoi', 
        format='%d/%m/%Y %H:%M',
        read_only=True
    )
    
    class Meta:
        model = Notification
        fields = [
            'notif_id', 'user', 'user_detail', 'message', 'type', 'type_display',
            'est_lue', 'date_envoi', 'date_envoi_formatted'
        ]
        read_only_fields = ['notif_id', 'date_envoi']

    def get_user_detail(self, obj):
        return {
            'username': obj.user.username,
            'role': obj.user.role,
            'email': obj.user.email
        }

class StatistiqueSerializer(serializers.ModelSerializer):
    gare_detail = serializers.SerializerMethodField(read_only=True)
    date_formatted = serializers.DateField(source='date', format='%d/%m/%Y', read_only=True)
    heure_pointe_formatted = serializers.TimeField(source='heure_pointe', format='%H:%M', read_only=True)
    
    class Meta:
        model = Statistique
        fields = [
            'stat_id', 'gare', 'gare_detail', 'date', 'date_formatted',
            'nb_vehicules', 'nb_passagers', 'heure_pointe', 'heure_pointe_formatted'
        ]
        read_only_fields = ['stat_id']

    def get_gare_detail(self, obj):
        return {
            'nom': obj.gare.nom,
            'localisation': obj.gare.localisation
        }

    def validate_nb_vehicules(self, value):
        if value < 0:
            raise serializers.ValidationError("Le nombre de véhicules ne peut pas être négatif.")
        return value

    def validate_nb_passagers(self, value):
        if value < 0:
            raise serializers.ValidationError("Le nombre de passagers ne peut pas être négatif.")
        return value
    

class ReclamationSerializer(serializers.ModelSerializer):
    chauffeur_detail = serializers.SerializerMethodField(read_only=True)
    gare_detail = serializers.SerializerMethodField(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    traite_par_detail = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Reclamation
        fields = [
            'reclamation_id', 'chauffeur', 'chauffeur_detail', 'gare', 'gare_detail',
            'type', 'type_display', 'titre', 'description', 'statut', 'statut_display',
            'date_creation', 'date_modification', 'traite_par', 'traite_par_detail'
        ]
        read_only_fields = ['reclamation_id', 'date_creation', 'date_modification']

    def get_chauffeur_detail(self, obj):
        return {
            'username': obj.chauffeur.username,
            'email': obj.chauffeur.email,
            'telephone': obj.chauffeur.telephone
        }

    def get_gare_detail(self, obj):
        return {
            'nom': obj.gare.nom,
            'localisation': obj.gare.localisation
        }

    def get_traite_par_detail(self, obj):
        if obj.traite_par:
            return {
                'username': obj.traite_par.username,
                'role': obj.traite_par.role
            }
        return None