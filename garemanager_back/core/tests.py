from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

class JWTAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',  
            role='CHAUFFEUR',
            CIN='TEST123',  
            telephone='1234567890'
        )

    def test_jwt_login(self):
        """Teste l'obtention d'un token JWT"""
        response = self.client.post(
        '/api/auth/login/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'  # Force le Content-Type: application/json
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())
        print("\n✔ Test login JWT réussi")

    def test_protected_endpoint(self):
        """Teste l'accès à un endpoint protégé"""
        login_resp = self.client.post(
            '/api/auth/login/',
            {'username': 'testuser', 'password': 'testpass123'},
            format='json'
        )
        token = login_resp.json()['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/vehicules/')  # Ajoutez le préfixe 'api/'
        self.assertEqual(response.status_code, 200)
        print("✔ Test endpoint protégé réussi")