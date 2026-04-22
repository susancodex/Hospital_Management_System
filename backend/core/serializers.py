from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    User,
    Doctor,
    Patient,
    Appointment,
    MedicalRecord,
    MedicalReport,
    Billing,
    BillingPayment,
)


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'profile_picture', 'phone')
        read_only_fields = ('id', 'role', 'is_active')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.role = 'reception'
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])


class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = '__all__'

    def get_full_name(self, obj):
        return f"Dr. {obj.first_name} {obj.last_name}"


class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = '__all__'

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = '__all__'

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" if obj.patient else ''

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}" if obj.doctor else ''


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = '__all__'

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" if obj.patient else ''

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}" if obj.doctor else ''


class BillingSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    appointment_date = serializers.SerializerMethodField()
    appointment_doctor_name = serializers.SerializerMethodField()
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Billing
        fields = '__all__'
        read_only_fields = ('paid_amount',)

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" if obj.patient else ''

    def get_appointment_date(self, obj):
        return obj.appointment.appointment_date if obj.appointment else None

    def get_appointment_doctor_name(self, obj):
        if not obj.appointment or not obj.appointment.doctor:
            return ''
        doctor = obj.appointment.doctor
        return f"Dr. {doctor.first_name} {doctor.last_name}"


class MedicalReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicalReport
        fields = '__all__'

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}" if obj.patient else ''

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}" if obj.doctor else ''


class BillingPaymentSerializer(serializers.ModelSerializer):
    billing_patient_name = serializers.SerializerMethodField()

    class Meta:
        model = BillingPayment
        fields = '__all__'

    def validate(self, attrs):
        billing = attrs.get('billing') or getattr(self.instance, 'billing', None)
        amount = attrs.get('amount')

        if amount is not None and amount <= 0:
            raise serializers.ValidationError({'amount': 'Payment amount must be greater than 0.'})

        if billing and amount is not None:
            previous_amount = self.instance.amount if self.instance else 0
            if amount > (billing.balance_due + previous_amount):
                raise serializers.ValidationError({'amount': 'Payment exceeds outstanding balance.'})

        return attrs

    def get_billing_patient_name(self, obj):
        patient = getattr(obj.billing, 'patient', None)
        return f"{patient.first_name} {patient.last_name}" if patient else ''
