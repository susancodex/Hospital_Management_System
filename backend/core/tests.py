from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from .models import Appointment, Billing, Doctor, MedicalRecord, Patient


User = get_user_model()


class AuthFlowTests(APITestCase):
    def test_register_login_and_profile_flow(self):
        register_payload = {
            'username': 'newpatient',
            'email': 'newpatient@example.com',
            'first_name': 'New',
            'last_name': 'Patient',
            'role': 'patient',
            'phone': '5550001234',
            'date_of_birth': '1998-02-14',
            'gender': 'F',
            'address': 'Kathmandu',
            'password': 'SafePass123!',
            'password2': 'SafePass123!',
        }

        register_response = self.client.post(reverse('register'), register_payload, format='json')

        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(register_response.data['user']['role'], 'patient')
        self.assertIn('access', register_response.data)
        self.assertIn('refresh', register_response.data)
        self.assertTrue(Patient.objects.filter(email='newpatient@example.com').exists())

        login_response = self.client.post(
            reverse('token_obtain_pair'),
            {'username': register_payload['username'], 'password': register_payload['password']},
            format='json',
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data['user']['username'], register_payload['username'])

        access_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        profile_response = self.client.get(reverse('profile'))

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['email'], register_payload['email'])

    def test_register_doctor_creates_linked_doctor_profile(self):
        register_payload = {
            'username': 'newdoctor',
            'email': 'newdoctor@example.com',
            'first_name': 'New',
            'last_name': 'Doctor',
            'role': 'doctor',
            'phone': '5550005678',
            'specialization': 'Cardiology',
            'license_number': 'DOC-123',
            'password': 'SafePass123!',
            'password2': 'SafePass123!',
        }

        response = self.client.post(reverse('register'), register_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'doctor')
        self.assertTrue(Doctor.objects.filter(email='newdoctor@example.com', specialization='Cardiology').exists())

    def test_superuser_role_is_forced_to_admin(self):
        user = User.objects.create_superuser(
            username='superadmin',
            email='superadmin@example.com',
            password='SuperSafe123!',
        )

        self.assertEqual(user.role, 'admin')

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id.apps.googleusercontent.com')
    def test_auth_config_exposes_google_setting(self):
        response = self.client.get(reverse('auth_config'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['google_enabled'])
        self.assertEqual(response.data['google_client_id'], 'google-client-id.apps.googleusercontent.com')

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id.apps.googleusercontent.com')
    @patch('core.views.verify_google_credential')
    def test_google_login_creates_user_and_returns_tokens(self, mock_verify_google_credential):
        mock_verify_google_credential.return_value = {
            'sub': 'google-sub-123',
            'email': 'google.user@example.com',
            'email_verified': True,
            'given_name': 'Google',
            'family_name': 'User',
        }

        response = self.client.post(reverse('google_login'), {'credential': 'fake-google-token'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'google.user@example.com')
        self.assertEqual(response.data['user']['role'], 'reception')
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(email='google.user@example.com', google_sub='google-sub-123').exists())


class CoreApiIntegrationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='apiadmin',
            email='apiadmin@example.com',
            password='SafePass123!',
            role='admin',
            first_name='API',
            last_name='Admin',
        )
        token_response = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'apiadmin', 'password': 'SafePass123!'},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}")

    def test_main_crud_endpoints_work_together(self):
        doctor_response = self.client.post('/api/doctors/', {
            'first_name': 'Jane',
            'last_name': 'Doctor',
            'email': 'jane.doctor@example.com',
            'phone': '5551234567',
            'specialization': 'Cardiology',
            'license_number': 'DOC-001',
            'is_available': True,
        }, format='json')
        self.assertEqual(doctor_response.status_code, status.HTTP_201_CREATED)

        patient_response = self.client.post('/api/patients/', {
            'first_name': 'John',
            'last_name': 'Patient',
            'email': 'john.patient@example.com',
            'phone': '5557654321',
            'date_of_birth': '1990-01-01',
            'gender': 'M',
            'address': 'Kathmandu',
        }, format='json')
        self.assertEqual(patient_response.status_code, status.HTTP_201_CREATED)

        appointment_response = self.client.post('/api/appointments/', {
            'patient': patient_response.data['id'],
            'doctor': doctor_response.data['id'],
            'appointment_date': '2026-04-22',
            'appointment_time': '10:30:00',
            'status': 'scheduled',
            'notes': 'Integration test appointment',
        }, format='json')
        self.assertEqual(appointment_response.status_code, status.HTTP_201_CREATED)

        medical_record_response = self.client.post('/api/medical-records/', {
            'patient': patient_response.data['id'],
            'doctor': doctor_response.data['id'],
            'diagnosis': 'Routine diagnosis',
            'treatment': 'Routine treatment',
            'notes': 'Integration record',
        }, format='json')
        self.assertEqual(medical_record_response.status_code, status.HTTP_201_CREATED)

        billing_response = self.client.post('/api/billing/', {
            'patient': patient_response.data['id'],
            'appointment': appointment_response.data['id'],
            'amount': '150.00',
            'status': 'unpaid',
            'description': 'Consultation charge',
        }, format='json')
        self.assertEqual(billing_response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(Doctor.objects.filter(id=doctor_response.data['id']).exists())
        self.assertTrue(Patient.objects.filter(id=patient_response.data['id']).exists())
        self.assertTrue(Appointment.objects.filter(id=appointment_response.data['id']).exists())
        self.assertTrue(MedicalRecord.objects.filter(id=medical_record_response.data['id']).exists())
        self.assertTrue(Billing.objects.filter(id=billing_response.data['id']).exists())

    def test_patient_can_only_access_linked_records(self):
        patient_user = User.objects.create_user(
            username='portalpatient',
            email='portalpatient@example.com',
            password='SafePass123!',
            role='patient',
            first_name='Portal',
            last_name='Patient',
        )
        patient_profile = Patient.objects.create(
            user=patient_user,
            first_name='Portal',
            last_name='Patient',
            email='portalpatient@example.com',
            phone='5551112222',
            date_of_birth='1992-01-01',
            gender='F',
        )
        other_patient = Patient.objects.create(
            first_name='Other',
            last_name='Patient',
            email='otherpatient@example.com',
            phone='5553334444',
            date_of_birth='1991-02-02',
            gender='M',
        )
        doctor = Doctor.objects.create(
            first_name='Assigned',
            last_name='Doctor',
            email='assigned.doctor@example.com',
            phone='5557778888',
            specialization='General Medicine',
        )
        Appointment.objects.create(
            patient=patient_profile,
            doctor=doctor,
            appointment_date='2026-04-22',
            appointment_time='09:00:00',
            created_by=self.user,
        )
        Appointment.objects.create(
            patient=other_patient,
            doctor=doctor,
            appointment_date='2026-04-23',
            appointment_time='10:00:00',
            created_by=self.user,
        )

        token_response = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'portalpatient', 'password': 'SafePass123!'},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}")

        patients_response = self.client.get('/api/patients/')
        appointments_response = self.client.get('/api/appointments/')

        self.assertEqual(patients_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(patients_response.data), 1)
        self.assertEqual(patients_response.data[0]['email'], 'portalpatient@example.com')
        self.assertEqual(appointments_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(appointments_response.data), 1)
