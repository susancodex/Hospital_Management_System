from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db.models import Q, Sum, Count
from django.http import FileResponse
from django.conf import settings
from django.utils.text import slugify
from django.shortcuts import redirect
from datetime import timedelta
from django.utils import timezone
from collections import defaultdict
from decimal import Decimal
from urllib.parse import urlencode
import uuid
from .pdf_utils import generate_invoice_pdf, generate_medical_report_pdf
from django.db import connection

from .models import Doctor, Patient, Appointment, MedicalRecord, MedicalReport, Billing, BillingPayment, User
from .permissions import RoleActionPermission, get_doctor_profile_for_user, get_patient_profile_for_user
from .serializers import (
    DoctorSerializer, PatientSerializer, AppointmentSerializer,
    MedicalRecordSerializer, MedicalReportSerializer,
    BillingSerializer, BillingPaymentSerializer, UserSerializer,
    RegisterSerializer, ChangePasswordSerializer, ForgotPasswordSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring service availability.
    Checks API and database connectivity.
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            'status': 'healthy',
            'message': 'Hospital Management System API is running',
            'database': 'connected',
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'message': f'Health check failed: {str(e)}',
            'database': 'disconnected',
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


def build_auth_response(user, request):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user, context={'request': request}).data,
    }


def verify_google_credential(credential, client_id):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
    except ImportError as exc:
        raise RuntimeError('Google sign-in support is not installed on the backend.') from exc

    request_adapter = requests.Request()
    return id_token.verify_oauth2_token(credential, request_adapter, client_id)


def generate_unique_username(email, given_name='', family_name=''):
    local_part = (email or '').split('@')[0].strip()
    base = slugify(local_part) or slugify(f'{given_name}-{family_name}') or 'google-user'
    candidate = base[:150]
    counter = 1

    while User.objects.filter(username=candidate).exists():
        suffix = f'-{counter}'
        candidate = f'{base[:150 - len(suffix)]}{suffix}'
        counter += 1

    return candidate


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        request = self.context.get('request')
        profile_pic = None
        if user.profile_picture:
            url = user.profile_picture.url
            profile_pic = request.build_absolute_uri(url) if request else url
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'phone': user.phone,
            'profile_picture': profile_pic,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(build_auth_response(user, request), status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')
    if not client_id:
        return Response(
            {'detail': 'Google sign-in is not configured on the server.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    credential = request.data.get('credential')
    if not credential:
        return Response({'credential': 'Google credential is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = verify_google_credential(credential, client_id)
    except RuntimeError as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except ValueError:
        return Response({'detail': 'Invalid Google credential.'}, status=status.HTTP_400_BAD_REQUEST)

    email = (payload.get('email') or '').strip().lower()
    if not email or not payload.get('email_verified'):
        return Response(
            {'detail': 'Google account email must be present and verified.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    sub = payload.get('sub')
    if not sub:
        return Response({'detail': 'Google account identifier is missing.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(google_sub=sub).first()
    if not user:
        user = User.objects.filter(email__iexact=email).first()

    if user and user.google_sub and user.google_sub != sub:
        return Response(
            {'detail': 'This email is already linked to a different Google account.'},
            status=status.HTTP_409_CONFLICT,
        )

    if not user:
        user = User(
            username=generate_unique_username(
                email=email,
                given_name=payload.get('given_name', ''),
                family_name=payload.get('family_name', ''),
            ),
            email=email,
            first_name=payload.get('given_name', ''),
            last_name=payload.get('family_name', ''),
            role='reception',
            google_sub=sub,
        )
        user.set_unusable_password()
        user.save()
    else:
        user.email = email
        user.google_sub = sub
        if payload.get('given_name') and not user.first_name:
            user.first_name = payload.get('given_name')
        if payload.get('family_name') and not user.last_name:
            user.last_name = payload.get('family_name')
        user.save()

    return Response(build_auth_response(user, request), status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def auth_config(request):
    return Response({
        'google_client_id': getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', ''),
        'google_enabled': bool(getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Simple password reset: verifies username + email match, then resets to new password.
    In production this should send an email with a token."""
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']
        try:
            user = User.objects.get(username=username, email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'No account found matching that username and email.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password reset successfully. You can now log in.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password updated successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def profile(request):
    user = request.user
    if request.method == 'GET':
        return Response(UserSerializer(user, context={'request': request}).data)
    serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'retrieve', 'update', 'partial_update'},
        'patient': {'retrieve', 'update', 'partial_update'},
        'reception': {'retrieve', 'update', 'partial_update'},
    }

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(pk=self.request.user.pk)


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve', 'update', 'partial_update', 'create', 'destroy'},
        'reception': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
    }
    filter_backends = [SearchFilter]
    search_fields = ['first_name', 'last_name', 'specialization', 'email', 'phone']


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'patient': {'list', 'retrieve', 'update', 'partial_update'},
        'reception': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
    }
    filter_backends = [SearchFilter]
    search_fields = ['first_name', 'last_name', 'phone', 'email']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'reception':
            return Patient.objects.all()

        if user.role == 'patient':
            patient_profile = get_patient_profile_for_user(user, Patient)
            if not patient_profile:
                return Patient.objects.none()
            return Patient.objects.filter(pk=patient_profile.pk)

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        if not doctor_profile:
            return Patient.objects.none()

        return Patient.objects.filter(
            Q(appointments__doctor=doctor_profile) |
            Q(medical_records__doctor=doctor_profile)
        ).distinct()


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related('patient', 'doctor').all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve', 'update', 'partial_update'},
        'patient': {'list', 'retrieve'},
        'reception': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
    }
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['appointment_date', 'doctor', 'patient', 'status']
    search_fields = ['patient__first_name', 'patient__last_name', 'doctor__first_name', 'doctor__last_name', 'notes', 'status']

    def get_queryset(self):
        user = self.request.user
        base_qs = Appointment.objects.select_related('patient', 'doctor').all()
        if user.role in {'admin', 'reception'}:
            return base_qs

        if user.role == 'patient':
            patient_profile = get_patient_profile_for_user(user, Patient)
            if not patient_profile:
                return Appointment.objects.none()
            return base_qs.filter(patient=patient_profile)

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        if not doctor_profile:
            return Appointment.objects.none()

        return base_qs.filter(doctor=doctor_profile)


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.select_related('patient', 'doctor').all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'patient': {'list', 'retrieve'},
        'reception': set(),
    }
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['patient', 'doctor']
    search_fields = ['diagnosis', 'treatment', 'notes', 'patient__first_name', 'patient__last_name']

    def get_queryset(self):
        user = self.request.user
        base_qs = MedicalRecord.objects.select_related('patient', 'doctor').all()
        if user.role == 'admin':
            return base_qs

        if user.role == 'patient':
            patient_profile = get_patient_profile_for_user(user, Patient)
            if not patient_profile:
                return MedicalRecord.objects.none()
            return base_qs.filter(patient=patient_profile)

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        if not doctor_profile:
            return MedicalRecord.objects.none()

        return base_qs.filter(doctor=doctor_profile)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'doctor':
            serializer.save()
            return

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        serializer.save(doctor=doctor_profile)


class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.select_related('patient', 'appointment', 'appointment__doctor').all()
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve'},
        'patient': {'list', 'retrieve'},
        'reception': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
    }
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'patient']
    search_fields = ['patient__first_name', 'patient__last_name', 'description', 'status']

    def get_queryset(self):
        user = self.request.user
        base_qs = Billing.objects.select_related('patient', 'appointment', 'appointment__doctor').all()

        if user.role in {'admin', 'reception'}:
            return base_qs

        if user.role == 'patient':
            patient_profile = get_patient_profile_for_user(user, Patient)
            if not patient_profile:
                return Billing.objects.none()
            return base_qs.filter(patient=patient_profile)

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        if not doctor_profile:
            return Billing.objects.none()

        return base_qs.filter(
            Q(appointment__doctor=doctor_profile) |
            Q(patient__appointments__doctor=doctor_profile) |
            Q(patient__medical_records__doctor=doctor_profile)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MedicalReportViewSet(viewsets.ModelViewSet):
    queryset = MedicalReport.objects.select_related('patient', 'doctor', 'appointment').all()
    serializer_class = MedicalReportSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'patient': {'list', 'retrieve'},
        'reception': {'list', 'retrieve'},
    }
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['patient', 'doctor', 'report_type', 'status']
    search_fields = ['title', 'summary', 'findings', 'recommendations', 'patient__first_name', 'patient__last_name']

    def get_queryset(self):
        user = self.request.user
        base_qs = MedicalReport.objects.select_related('patient', 'doctor', 'appointment').all()
        if user.role in {'admin', 'reception'}:
            return base_qs

        if user.role == 'patient':
            patient_profile = get_patient_profile_for_user(user, Patient)
            if not patient_profile:
                return MedicalReport.objects.none()
            return base_qs.filter(patient=patient_profile)

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        if not doctor_profile:
            return MedicalReport.objects.none()

        return base_qs.filter(doctor=doctor_profile)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'doctor':
            serializer.save(created_by=user)
            return

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        serializer.save(created_by=user, doctor=doctor_profile)


class BillingPaymentViewSet(viewsets.ModelViewSet):
    queryset = BillingPayment.objects.select_related('billing', 'billing__patient').all()
    serializer_class = BillingPaymentSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve'},
        'patient': {'list', 'retrieve'},
        'reception': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
    }
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['billing', 'payment_method', 'gateway', 'transaction_status']
    search_fields = ['billing__patient__first_name', 'billing__patient__last_name', 'reference_number', 'notes']

    def get_queryset(self):
        user = self.request.user
        base_qs = BillingPayment.objects.select_related('billing', 'billing__patient')
        if user.role in {'admin', 'reception'}:
            return base_qs

        if user.role == 'patient':
            patient_profile = get_patient_profile_for_user(user, Patient)
            if not patient_profile:
                return BillingPayment.objects.none()
            return base_qs.filter(billing__patient=patient_profile)

        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        if not doctor_profile:
            return BillingPayment.objects.none()

        return base_qs.filter(
            Q(billing__appointment__doctor=doctor_profile) |
            Q(billing__patient__appointments__doctor=doctor_profile)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)


def _can_access_billing(user, billing):
    if user.role in {'admin', 'reception'}:
        return True

    if user.role == 'patient':
        patient_profile = get_patient_profile_for_user(user, Patient)
        return bool(patient_profile and billing.patient_id == patient_profile.id)

    if user.role == 'doctor':
        doctor_profile = get_doctor_profile_for_user(user, Doctor)
        if not doctor_profile:
            return False
        return billing.appointment_id and billing.appointment and billing.appointment.doctor_id == doctor_profile.id

    return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_esewa_payment(request, billing_id):
    try:
        billing = Billing.objects.select_related('appointment', 'appointment__doctor').get(id=billing_id)
    except Billing.DoesNotExist:
        return Response({'detail': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)

    if not _can_access_billing(request.user, billing):
        return Response({'detail': 'You do not have access to this bill.'}, status=status.HTTP_403_FORBIDDEN)

    if billing.balance_due <= 0:
        return Response({'detail': 'This invoice is already fully paid.'}, status=status.HTTP_400_BAD_REQUEST)

    requested_amount = request.data.get('amount', billing.balance_due)
    try:
        amount = Decimal(str(requested_amount))
    except Exception:
        return Response({'amount': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'amount': 'Amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount > billing.balance_due:
        return Response({'amount': 'Amount exceeds outstanding balance.'}, status=status.HTTP_400_BAD_REQUEST)

    pid = f'INV{billing.id}-{uuid.uuid4().hex[:10].upper()}'
    payment = BillingPayment.objects.create(
        billing=billing,
        amount=amount,
        payment_method='esewa',
        gateway='esewa',
        transaction_status='pending',
        reference_number=pid,
        notes='eSewa payment initiated',
        received_by=request.user,
        gateway_payload={
            'initiated_by': request.user.id,
            'initiated_at': timezone.now().isoformat(),
        },
    )

    params = {
        'amt': str(amount),
        'pdc': '0',
        'psc': '0',
        'txAmt': '0',
        'tAmt': str(amount),
        'pid': pid,
        'scd': getattr(settings, 'ESEWA_MERCHANT_CODE', 'EPAYTEST'),
        'su': getattr(settings, 'ESEWA_SUCCESS_URL', ''),
        'fu': getattr(settings, 'ESEWA_FAILURE_URL', ''),
    }
    payment_url = f"{getattr(settings, 'ESEWA_BASE_URL', '').rstrip('/')}?{urlencode(params)}"

    return Response({
        'payment_id': payment.id,
        'invoice_id': billing.id,
        'amount': float(amount),
        'reference_number': pid,
        'payment_url': payment_url,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def esewa_success_callback(request):
    pid = request.query_params.get('oid') or request.query_params.get('pid')
    ref_id = request.query_params.get('refId', '')

    if not pid:
        return redirect(getattr(settings, 'ESEWA_REDIRECT_FAILURE', '/'))

    payment = BillingPayment.objects.filter(reference_number=pid, gateway='esewa').first()
    if not payment:
        return redirect(getattr(settings, 'ESEWA_REDIRECT_FAILURE', '/'))

    if payment.transaction_status != 'verified':
        payment.transaction_status = 'verified'
        payment.gateway_transaction_id = ref_id or payment.gateway_transaction_id
        payment.verified_at = timezone.now()
        payload = payment.gateway_payload or {}
        payload['callback'] = dict(request.query_params)
        payload['callback_at'] = timezone.now().isoformat()
        payment.gateway_payload = payload
        payment.save(update_fields=['transaction_status', 'gateway_transaction_id', 'verified_at', 'gateway_payload'])
        payment.billing.update_payment_totals()

    return redirect(getattr(settings, 'ESEWA_REDIRECT_SUCCESS', '/'))


@api_view(['GET'])
@permission_classes([AllowAny])
def esewa_failure_callback(request):
    pid = request.query_params.get('oid') or request.query_params.get('pid')
    payment = BillingPayment.objects.filter(reference_number=pid, gateway='esewa').first()
    if payment and payment.transaction_status == 'pending':
        payment.transaction_status = 'failed'
        payload = payment.gateway_payload or {}
        payload['failed_callback'] = dict(request.query_params)
        payload['failed_at'] = timezone.now().isoformat()
        payment.gateway_payload = payload
        payment.save(update_fields=['transaction_status', 'gateway_payload'])

    return redirect(getattr(settings, 'ESEWA_REDIRECT_FAILURE', '/'))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_bank_transfer(request, billing_id):
    try:
        billing = Billing.objects.select_related('appointment', 'appointment__doctor').get(id=billing_id)
    except Billing.DoesNotExist:
        return Response({'detail': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)

    if not _can_access_billing(request.user, billing):
        return Response({'detail': 'You do not have access to this bill.'}, status=status.HTTP_403_FORBIDDEN)

    if billing.balance_due <= 0:
        return Response({'detail': 'This invoice is already fully paid.'}, status=status.HTTP_400_BAD_REQUEST)

    requested_amount = request.data.get('amount', billing.balance_due)
    try:
        amount = Decimal(str(requested_amount))
    except Exception:
        return Response({'amount': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'amount': 'Amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount > billing.balance_due:
        return Response({'amount': 'Amount exceeds outstanding balance.'}, status=status.HTTP_400_BAD_REQUEST)

    reference = f'BANK-INV{billing.id}-{uuid.uuid4().hex[:8].upper()}'
    payment = BillingPayment.objects.create(
        billing=billing,
        amount=amount,
        payment_method='bank',
        gateway='bank',
        transaction_status='pending',
        reference_number=reference,
        notes='Bank transfer initiated',
        received_by=request.user,
        gateway_payload={
            'initiated_by': request.user.id,
            'initiated_at': timezone.now().isoformat(),
        },
    )

    return Response({
        'payment_id': payment.id,
        'invoice_id': billing.id,
        'amount': float(amount),
        'reference_number': reference,
        'bank_details': {
            'account_name': getattr(settings, 'BANK_TRANSFER_ACCOUNT_NAME', ''),
            'bank_name': getattr(settings, 'BANK_TRANSFER_BANK_NAME', ''),
            'account_number': getattr(settings, 'BANK_TRANSFER_ACCOUNT_NUMBER', ''),
            'branch': getattr(settings, 'BANK_TRANSFER_BRANCH', ''),
        },
        'instructions': 'Complete the transfer using this reference number and ask billing desk to verify it.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_billing_payment(request, payment_id):
    if request.user.role not in {'admin', 'reception'}:
        return Response({'detail': 'Only admin or reception can verify payments.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        payment = BillingPayment.objects.select_related('billing').get(id=payment_id)
    except BillingPayment.DoesNotExist:
        return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

    gateway_txn = request.data.get('gateway_transaction_id', '')
    notes = request.data.get('notes', '')

    payment.transaction_status = 'verified'
    payment.verified_at = timezone.now()
    if gateway_txn:
        payment.gateway_transaction_id = gateway_txn
    if notes:
        payment.notes = f"{payment.notes}\n{notes}".strip()
    payment.save(update_fields=['transaction_status', 'verified_at', 'gateway_transaction_id', 'notes'])
    payment.billing.update_payment_totals()

    return Response({'detail': 'Payment verified successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_invoice_pdf(request, billing_id):
    """Download invoice as PDF."""
    try:
        billing = Billing.objects.get(id=billing_id)
        pdf_buffer = generate_invoice_pdf(billing)
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'invoice_{billing.id}.pdf',
            content_type='application/pdf',
        )
    except Billing.DoesNotExist:
        return Response({'detail': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_medical_report_pdf(request, report_id):
    """Download medical report as PDF."""
    try:
        report = MedicalReport.objects.get(id=report_id)
        pdf_buffer = generate_medical_report_pdf(report)
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'medical_report_{report.id}.pdf',
            content_type='application/pdf',
        )
    except MedicalReport.DoesNotExist:
        return Response({'detail': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_dashboard_stats(request):
    """Get billing dashboard statistics and trends."""
    # Overall stats
    total_billed = Billing.objects.aggregate(Sum('amount'))['amount__sum'] or 0
    total_collected = Billing.objects.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
    outstanding_total = Billing.objects.aggregate(Sum('amount'))['amount__sum'] or 0
    outstanding_total = outstanding_total - total_collected if outstanding_total else 0
    
    # Count by status
    status_counts = Billing.objects.values('status').annotate(count=Count('id'), amount=Sum('amount'))
    
    # Last 30 days collections
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_collections = BillingPayment.objects.filter(
        transaction_status='verified',
        payment_date__gte=thirty_days_ago
    ).extra(
        select={'payment_day': 'DATE(payment_date)'}
    ).values('payment_day').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('payment_day')
    
    # Insurance pending
    insurance_pending_count = Billing.objects.filter(status='insurance_pending').count()
    insurance_pending_amount = Billing.objects.filter(status='insurance_pending').aggregate(Sum('balance_due'))['balance_due__sum'] or 0
    
    # AR aging
    today = timezone.now().date()
    current_due = Billing.objects.filter(due_date__lte=today, status__in=['unpaid', 'partial']).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
    overdue_30 = Billing.objects.filter(due_date__lt=today - timedelta(days=30), status__in=['unpaid', 'partial']).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
    overdue_60 = Billing.objects.filter(due_date__lt=today - timedelta(days=60), status__in=['unpaid', 'partial']).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
    overdue_90 = Billing.objects.filter(due_date__lt=today - timedelta(days=90), status__in=['unpaid', 'partial']).aggregate(Sum('balance_due'))['balance_due__sum'] or 0
    
    return Response({
        'total_billed': float(total_billed),
        'total_collected': float(total_collected),
        'total_outstanding': float(outstanding_total),
        'status_breakdown': list(status_counts),
        'insurance_pending': {
            'count': insurance_pending_count,
            'amount': float(insurance_pending_amount),
        },
        'daily_collections': [
            {
                'date': str(item['payment_day']),
                'amount': float(item['total']),
                'count': item['count'],
            }
            for item in daily_collections
        ],
        'ar_aging': {
            'current': float(current_due),
            'overdue_30': float(overdue_30),
            'overdue_60': float(overdue_60),
            'overdue_90': float(overdue_90),
        },
    })


def _patient_age(dob):
    if not dob:
        return None
    today = timezone.localdate()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_insights(request):
    """Lightweight AI/ML-style insights based on historical behavior and risk scoring."""
    today = timezone.localdate()
    last_90_days = today - timedelta(days=90)
    next_7_days = today + timedelta(days=7)

    appointments_recent = Appointment.objects.filter(appointment_date__gte=last_90_days)
    no_show_counts = defaultdict(int)
    recent_counts = defaultdict(int)
    for appt in appointments_recent:
        pid = appt.patient_id
        recent_counts[pid] += 1
        if appt.status == 'no_show':
            no_show_counts[pid] += 1

    billing_items = Billing.objects.select_related('patient').all()
    patient_balance = defaultdict(float)
    overdue_balance = 0.0
    for bill in billing_items:
        balance = float(bill.balance_due or 0)
        if balance <= 0:
            continue
        patient_balance[bill.patient_id] += balance
        if bill.due_date and bill.due_date < today:
            overdue_balance += balance

    risk_candidates = []
    for patient in Patient.objects.all():
        score = 0
        reasons = []
        age = _patient_age(patient.date_of_birth)
        if age is not None and age >= 65:
            score += 2
            reasons.append('senior age profile')
        if patient.is_critical:
            score += 3
            reasons.append('critical care flag')
        if patient.acuity_level and patient.acuity_level <= 2:
            score += 2
            reasons.append('high acuity')
        if (patient.chronic_conditions or '').strip():
            score += 1
            reasons.append('chronic condition history')
        balance = patient_balance.get(patient.id, 0.0)
        if balance > 500:
            score += 2
            reasons.append('high outstanding balance')
        missed = no_show_counts.get(patient.id, 0)
        if missed >= 2:
            score += 2
            reasons.append('repeated missed appointments')

        if score >= 3:
            risk_candidates.append({
                'patient_id': patient.id,
                'patient_name': patient.full_name,
                'risk_score': score,
                'risk_level': 'high' if score >= 6 else 'medium',
                'outstanding_balance': round(balance, 2),
                'reasons': reasons,
            })

    risk_candidates.sort(key=lambda item: item['risk_score'], reverse=True)

    no_show_predictions = []
    upcoming = Appointment.objects.select_related('patient', 'doctor').filter(
        appointment_date__gte=today,
        appointment_date__lte=next_7_days,
        status__in=['scheduled', 'pending']
    )

    for appt in upcoming:
        pid = appt.patient_id
        total_recent = recent_counts.get(pid, 0)
        missed_recent = no_show_counts.get(pid, 0)
        historical_rate = (missed_recent / total_recent) if total_recent else 0.0
        days_ahead = (appt.appointment_date - today).days

        probability = 0.08
        probability += min(historical_rate * 0.75, 0.55)
        if days_ahead >= 4:
            probability += 0.08
        if patient_balance.get(pid, 0.0) > 300:
            probability += 0.06

        probability = max(0.01, min(probability, 0.95))
        no_show_predictions.append({
            'appointment_id': appt.id,
            'appointment_date': str(appt.appointment_date),
            'appointment_time': str(appt.appointment_time),
            'patient_name': appt.patient.full_name,
            'doctor_name': appt.doctor.full_name,
            'no_show_probability': round(probability, 2),
        })

    no_show_predictions.sort(key=lambda item: item['no_show_probability'], reverse=True)

    high_risk_no_show_count = sum(1 for item in no_show_predictions if item['no_show_probability'] >= 0.5)

    return Response({
        'model_version': 'heuristic-risk-v1',
        'generated_at': timezone.now().isoformat(),
        'risk_summary': {
            'high_risk_patients': sum(1 for item in risk_candidates if item['risk_level'] == 'high'),
            'medium_risk_patients': sum(1 for item in risk_candidates if item['risk_level'] == 'medium'),
            'overdue_balance': round(overdue_balance, 2),
            'high_no_show_risk_appointments': high_risk_no_show_count,
        },
        'top_patient_risks': risk_candidates[:8],
        'no_show_predictions': no_show_predictions[:8],
    })

