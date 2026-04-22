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
from django.db.models import Q

from .models import Doctor, Patient, Appointment, MedicalRecord, Billing, User
from .permissions import RoleActionPermission, get_doctor_profile_for_user
from .serializers import (
    DoctorSerializer, PatientSerializer, AppointmentSerializer,
    MedicalRecordSerializer, BillingSerializer, UserSerializer,
    RegisterSerializer, ChangePasswordSerializer, ForgotPasswordSerializer,
)


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
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        'reception': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
    }
    filter_backends = [SearchFilter]
    search_fields = ['first_name', 'last_name', 'phone', 'email']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'reception':
            return Patient.objects.all()

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
    queryset = Billing.objects.select_related('patient').all()
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated, RoleActionPermission]
    permission_map = {
        'admin': {'list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'},
        'doctor': {'list', 'retrieve'},
        'reception': set(),
    }
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'patient']
    search_fields = ['patient__first_name', 'patient__last_name', 'description', 'status']








