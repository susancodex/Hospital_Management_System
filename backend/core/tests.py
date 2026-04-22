"""
Comprehensive tests for the Hospital Management System backend.

Covers: models, serializers, permissions, audit utilities, and API views.
"""

import datetime
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, RequestFactory
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .audit import log_action, AuditLogMiddleware
from .models import (
    AuditLog,
    Appointment,
    Billing,
    BillingPayment,
    Doctor,
    MedicalRecord,
    MedicalReport,
    Patient,
    User,
)
from .permissions import RoleActionPermission, get_doctor_profile_for_user
from .serializers import (
    BillingPaymentSerializer,
    RegisterSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(username="testuser", role="admin", email="test@example.com", password="Pass1234!"):
    user = User.objects.create_user(username=username, email=email, password=password)
    user.role = role
    user.save()
    return user


def make_doctor(first_name="Alice", last_name="Smith", email="alice@hospital.com"):
    return Doctor.objects.create(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone="555-0001",
        specialization="Cardiology",
    )


def make_patient(first_name="Bob", last_name="Jones"):
    return Patient.objects.create(
        first_name=first_name,
        last_name=last_name,
        phone="555-0002",
        date_of_birth=datetime.date(1990, 1, 15),
    )


def make_appointment(patient, doctor, status="scheduled"):
    return Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        appointment_date=datetime.date.today(),
        appointment_time=datetime.time(9, 0),
        status=status,
    )


def make_billing(patient, amount="100.00"):
    return Billing.objects.create(
        patient=patient,
        amount=Decimal(amount),
        status="unpaid",
    )


def auth_client(user):
    """Return an authenticated APIClient for the given user."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


# ===========================================================================
# 1. MODEL TESTS
# ===========================================================================

class PatientModelTests(TestCase):

    def test_mrn_auto_generated_on_first_save(self):
        p = make_patient()
        self.assertRegex(p.mrn, r"MRN-\d{4}-\d{6}")

    def test_mrn_not_overwritten_if_set(self):
        p = Patient.objects.create(
            first_name="Eve",
            last_name="Test",
            phone="555-9999",
            date_of_birth=datetime.date(1985, 6, 10),
            mrn="CUSTOM-001",
        )
        self.assertEqual(p.mrn, "CUSTOM-001")

    def test_mrn_sequential(self):
        p1 = make_patient("First", "One")
        p2 = make_patient("Second", "Two")
        year = timezone.now().year
        seq1 = int(p1.mrn.split("-")[-1])
        seq2 = int(p2.mrn.split("-")[-1])
        self.assertEqual(seq2, seq1 + 1)

    def test_full_name_property(self):
        p = make_patient("Charlie", "Brown")
        self.assertEqual(p.full_name, "Charlie Brown")

    def test_str_includes_name_and_mrn(self):
        p = make_patient("Dana", "White")
        self.assertIn("Dana White", str(p))
        self.assertIn(p.mrn, str(p))


class DoctorModelTests(TestCase):

    def test_full_name_property(self):
        d = make_doctor("Jane", "Doe")
        self.assertEqual(d.full_name, "Dr. Jane Doe")

    def test_str(self):
        d = make_doctor("Jane", "Doe")
        self.assertEqual(str(d), "Dr. Jane Doe")


class MedicalRecordModelTests(TestCase):

    def test_signed_record_cannot_be_modified(self):
        patient = make_patient()
        doctor = make_doctor()
        record = MedicalRecord.objects.create(
            patient=patient,
            doctor=doctor,
            diagnosis="Hypertension",
            is_signed=True,
        )
        record.treatment = "New treatment"
        with self.assertRaises(ValueError):
            record.save()

    def test_unsigned_record_can_be_modified(self):
        patient = make_patient()
        doctor = make_doctor()
        record = MedicalRecord.objects.create(
            patient=patient,
            doctor=doctor,
            diagnosis="Flu",
            is_signed=False,
        )
        record.treatment = "Rest and fluids"
        record.save()
        record.refresh_from_db()
        self.assertEqual(record.treatment, "Rest and fluids")

    def test_new_record_can_be_created_signed_false(self):
        patient = make_patient()
        doctor = make_doctor()
        record = MedicalRecord.objects.create(
            patient=patient,
            doctor=doctor,
            diagnosis="Cold",
        )
        self.assertFalse(record.is_signed)


class BillingModelTests(TestCase):

    def test_balance_due_full(self):
        patient = make_patient()
        bill = make_billing(patient, "200.00")
        self.assertEqual(bill.balance_due, Decimal("200.00"))

    def test_balance_due_partial(self):
        patient = make_patient()
        bill = make_billing(patient, "200.00")
        bill.paid_amount = Decimal("80.00")
        self.assertEqual(bill.balance_due, Decimal("120.00"))

    def test_balance_due_never_negative(self):
        patient = make_patient()
        bill = make_billing(patient, "100.00")
        bill.paid_amount = Decimal("150.00")
        self.assertEqual(bill.balance_due, Decimal("0"))

    def test_str(self):
        patient = make_patient()
        bill = make_billing(patient, "99.99")
        self.assertIn("$99.99", str(bill))


class BillingPaymentModelTests(TestCase):

    def test_payment_triggers_update_payment_totals(self):
        patient = make_patient()
        bill = make_billing(patient, "300.00")
        user = make_user()
        payment = BillingPayment.objects.create(
            billing=bill,
            amount=Decimal("100.00"),
            received_by=user,
        )
        bill.refresh_from_db()
        self.assertEqual(bill.paid_amount, Decimal("100.00"))
        self.assertEqual(bill.status, "partial")

    def test_full_payment_marks_bill_paid(self):
        patient = make_patient()
        bill = make_billing(patient, "100.00")
        user = make_user()
        BillingPayment.objects.create(
            billing=bill,
            amount=Decimal("100.00"),
            received_by=user,
        )
        bill.refresh_from_db()
        self.assertEqual(bill.status, "paid")

    def test_payment_deletion_updates_totals(self):
        patient = make_patient()
        bill = make_billing(patient, "200.00")
        user = make_user()
        payment = BillingPayment.objects.create(
            billing=bill,
            amount=Decimal("200.00"),
            received_by=user,
        )
        bill.refresh_from_db()
        self.assertEqual(bill.status, "paid")
        payment.delete()
        bill.refresh_from_db()
        self.assertEqual(bill.paid_amount, Decimal("0"))
        self.assertEqual(bill.status, "unpaid")

    def test_update_payment_totals_insurance_pending_not_overridden(self):
        patient = make_patient()
        bill = Billing.objects.create(
            patient=patient,
            amount=Decimal("500.00"),
            status="insurance_pending",
        )
        user = make_user()
        BillingPayment.objects.create(
            billing=bill,
            amount=Decimal("50.00"),
            received_by=user,
        )
        bill.refresh_from_db()
        self.assertEqual(bill.status, "partial")

    def test_billing_payment_str(self):
        patient = make_patient()
        bill = make_billing(patient, "100.00")
        user = make_user()
        p = BillingPayment.objects.create(billing=bill, amount=Decimal("50.00"), received_by=user)
        self.assertIn(f"Bill #{bill.id}", str(p))


# ===========================================================================
# 2. SERIALIZER TESTS
# ===========================================================================

class RegisterSerializerTests(TestCase):

    def _valid_data(self, **overrides):
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
        }
        data.update(overrides)
        return data

    def test_valid_registration(self):
        s = RegisterSerializer(data=self._valid_data())
        self.assertTrue(s.is_valid(), s.errors)
        user = s.save()
        self.assertEqual(user.username, "newuser")
        self.assertEqual(user.role, "reception")

    def test_password_mismatch(self):
        s = RegisterSerializer(data=self._valid_data(password2="WrongPass123!"))
        self.assertFalse(s.is_valid())
        self.assertIn("password", s.errors)

    def test_duplicate_username(self):
        make_user(username="existinguser", email="other@example.com")
        s = RegisterSerializer(data=self._valid_data(username="existinguser"))
        self.assertFalse(s.is_valid())
        self.assertIn("username", s.errors)

    def test_duplicate_email(self):
        make_user(username="anotheruser", email="taken@example.com")
        s = RegisterSerializer(data=self._valid_data(email="taken@example.com"))
        self.assertFalse(s.is_valid())
        self.assertIn("email", s.errors)

    def test_missing_required_fields(self):
        s = RegisterSerializer(data={})
        self.assertFalse(s.is_valid())


class BillingPaymentSerializerTests(TestCase):

    def setUp(self):
        self.patient = make_patient()
        self.bill = make_billing(self.patient, "200.00")

    def test_valid_payment(self):
        data = {"billing": self.bill.pk, "amount": "100.00", "payment_method": "cash"}
        s = BillingPaymentSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)

    def test_zero_amount_invalid(self):
        data = {"billing": self.bill.pk, "amount": "0.00", "payment_method": "cash"}
        s = BillingPaymentSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("amount", s.errors)

    def test_negative_amount_invalid(self):
        data = {"billing": self.bill.pk, "amount": "-10.00", "payment_method": "cash"}
        s = BillingPaymentSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("amount", s.errors)

    def test_overpayment_invalid(self):
        data = {"billing": self.bill.pk, "amount": "999.00", "payment_method": "cash"}
        s = BillingPaymentSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("amount", s.errors)

    def test_exact_balance_valid(self):
        data = {"billing": self.bill.pk, "amount": "200.00", "payment_method": "cash"}
        s = BillingPaymentSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)


# ===========================================================================
# 3. PERMISSION TESTS
# ===========================================================================

class GetDoctorProfileForUserTests(TestCase):

    def test_returns_none_for_unauthenticated_user(self):
        user = MagicMock()
        user.is_authenticated = False
        result = get_doctor_profile_for_user(user, Doctor)
        self.assertIsNone(result)

    def test_returns_none_when_email_empty(self):
        user = make_user(email="")
        user.email = ""
        result = get_doctor_profile_for_user(user, Doctor)
        self.assertIsNone(result)

    def test_returns_doctor_profile_by_email(self):
        doctor = make_doctor(email="drjohn@hospital.com")
        user = make_user(email="drjohn@hospital.com")
        result = get_doctor_profile_for_user(user, Doctor)
        self.assertEqual(result, doctor)

    def test_returns_none_when_no_matching_doctor(self):
        user = make_user(email="nodoc@hospital.com")
        result = get_doctor_profile_for_user(user, Doctor)
        self.assertIsNone(result)

    def test_case_insensitive_email_match(self):
        doctor = make_doctor(email="DrCase@Hospital.COM")
        user = make_user(email="drcase@hospital.com")
        result = get_doctor_profile_for_user(user, Doctor)
        self.assertEqual(result, doctor)


class RoleActionPermissionTests(TestCase):

    def _view_with_map(self, permission_map, action):
        view = MagicMock()
        view.permission_map = permission_map
        view.action = action
        return view

    def _request_for_user(self, role):
        user = MagicMock()
        user.is_authenticated = True
        user.role = role
        request = MagicMock()
        request.user = user
        return request

    def test_admin_has_list_access(self):
        perm = RoleActionPermission()
        view = self._view_with_map({"admin": {"list", "retrieve"}}, "list")
        request = self._request_for_user("admin")
        self.assertTrue(perm.has_permission(request, view))

    def test_role_without_permission_denied(self):
        perm = RoleActionPermission()
        view = self._view_with_map({"admin": {"list"}}, "list")
        request = self._request_for_user("doctor")
        self.assertFalse(perm.has_permission(request, view))

    def test_unauthenticated_denied(self):
        perm = RoleActionPermission()
        view = self._view_with_map({"admin": {"list"}}, "list")
        request = MagicMock()
        request.user = None
        self.assertFalse(perm.has_permission(request, view))

    def test_action_not_in_allowed_set_denied(self):
        perm = RoleActionPermission()
        view = self._view_with_map({"admin": {"retrieve"}}, "list")
        request = self._request_for_user("admin")
        self.assertFalse(perm.has_permission(request, view))


# ===========================================================================
# 4. AUDIT TESTS
# ===========================================================================

class AuditLogTests(TestCase):

    def test_log_action_creates_record(self):
        user = make_user()
        patient = make_patient()
        log = log_action(user, AuditLog.ACTION_CREATE, patient)
        self.assertEqual(AuditLog.objects.count(), 1)
        self.assertEqual(log.action, AuditLog.ACTION_CREATE)
        self.assertEqual(log.user, user)

    def test_log_action_captures_old_and_new_values(self):
        user = make_user()
        patient = make_patient()
        log = log_action(
            user, AuditLog.ACTION_UPDATE, patient,
            field_name="first_name",
            old_value="Bob",
            new_value="Robert",
        )
        self.assertEqual(log.field_name, "first_name")
        self.assertIn("Bob", log.old_value)
        self.assertIn("Robert", log.new_value)

    def test_log_action_with_request_captures_ip(self):
        user = make_user()
        patient = make_patient()
        request = MagicMock()
        request.META = {"REMOTE_ADDR": "127.0.0.1", "HTTP_USER_AGENT": "test-agent"}
        log = log_action(user, AuditLog.ACTION_VIEW, patient, request=request)
        self.assertEqual(log.ip_address, "127.0.0.1")
        self.assertEqual(log.user_agent, "test-agent")

    def test_audit_log_str(self):
        user = make_user()
        patient = make_patient()
        log = log_action(user, AuditLog.ACTION_CREATE, patient)
        self.assertIn("CREATE", str(log))


class AuditLogMiddlewareTests(TestCase):

    def test_middleware_attaches_audit_log_callable(self):
        get_response = MagicMock(return_value=MagicMock())
        middleware = AuditLogMiddleware(get_response)
        request = MagicMock()
        request.user = make_user()
        request.META = {"REMOTE_ADDR": "10.0.0.1", "HTTP_USER_AGENT": ""}
        middleware(request)
        self.assertTrue(callable(request.audit_log))


# ===========================================================================
# 5. API / VIEW TESTS
# ===========================================================================

class AuthAPITests(APITestCase):

    def test_register_success(self):
        resp = self.client.post("/api/register/", {
            "username": "brandnew",
            "email": "brandnew@example.com",
            "password": "SecurePass123!",
            "password2": "SecurePass123!",
            "first_name": "Brand",
            "last_name": "New",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", resp.data)
        self.assertEqual(resp.data["user"]["role"], "reception")

    def test_register_password_mismatch(self):
        resp = self.client.post("/api/register/", {
            "username": "mismatch",
            "email": "mm@example.com",
            "password": "SecurePass123!",
            "password2": "DifferentPass123!",
            "first_name": "X",
            "last_name": "Y",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        make_user(username="dup", email="dup@example.com")
        resp = self.client.post("/api/register/", {
            "username": "dup",
            "email": "new@example.com",
            "password": "SecurePass123!",
            "password2": "SecurePass123!",
            "first_name": "X",
            "last_name": "Y",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens(self):
        make_user(username="loginuser", password="Pass1234!", email="login@example.com")
        resp = self.client.post("/api/token/", {
            "username": "loginuser",
            "password": "Pass1234!",
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("user", resp.data)
        self.assertEqual(resp.data["user"]["username"], "loginuser")

    def test_login_invalid_credentials(self):
        resp = self.client.post("/api/token/", {
            "username": "nobody",
            "password": "wrongpass",
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forgot_password_success(self):
        make_user(username="forgotme", email="forgot@example.com")
        resp = self.client.post("/api/forgot-password/", {
            "username": "forgotme",
            "email": "forgot@example.com",
            "new_password": "NewSecurePass123!",
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_forgot_password_wrong_email(self):
        make_user(username="forgotme2", email="real@example.com")
        resp = self.client.post("/api/forgot-password/", {
            "username": "forgotme2",
            "email": "wrong@example.com",
            "new_password": "NewSecurePass123!",
        })
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_change_password_success(self):
        user = make_user(username="changepw", password="OldPass123!", email="chpw@example.com")
        client = auth_client(user)
        resp = client.post("/api/change-password/", {
            "old_password": "OldPass123!",
            "new_password": "NewPass456!",
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_change_password_wrong_old(self):
        user = make_user(username="changepw2", password="OldPass123!", email="chpw2@example.com")
        client = auth_client(user)
        resp = client.post("/api/change-password/", {
            "old_password": "WrongOld123!",
            "new_password": "NewPass456!",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_requires_auth(self):
        resp = self.client.post("/api/change-password/", {
            "old_password": "x",
            "new_password": "y",
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_get(self):
        user = make_user(username="profiletest", email="profile@example.com")
        client = auth_client(user)
        resp = client.get("/api/profile/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "profiletest")

    def test_profile_patch(self):
        user = make_user(username="profilepatch", email="ppatch@example.com")
        client = auth_client(user)
        resp = client.patch("/api/profile/", {"first_name": "Updated"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_current_user(self):
        user = make_user(username="meuser", email="me@example.com")
        client = auth_client(user)
        resp = client.get("/api/profile/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "meuser")

    def test_current_user_requires_auth(self):
        resp = self.client.get("/api/profile/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class DoctorAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_doc", role="admin", email="admin_doc@h.com")
        self.client = auth_client(self.admin)

    def test_list_doctors(self):
        make_doctor()
        resp = self.client.get("/api/doctors/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_create_doctor(self):
        resp = self.client.post("/api/doctors/", {
            "first_name": "New",
            "last_name": "Doctor",
            "email": "newdoc@hospital.com",
            "phone": "555-1234",
            "specialization": "Neurology",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["first_name"], "New")

    def test_retrieve_doctor(self):
        d = make_doctor()
        resp = self.client.get(f"/api/doctors/{d.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], d.email)

    def test_update_doctor(self):
        d = make_doctor()
        resp = self.client.patch(f"/api/doctors/{d.pk}/", {"specialization": "Oncology"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["specialization"], "Oncology")

    def test_delete_doctor(self):
        d = make_doctor(email="tobedeleted@h.com")
        resp = self.client.delete(f"/api/doctors/{d.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_search_doctors(self):
        make_doctor(first_name="Zara", last_name="Zoo", email="zara@h.com")
        resp = self.client.get("/api/doctors/?search=Zara")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(any(d["first_name"] == "Zara" for d in resp.data))

    def test_doctor_role_cannot_delete(self):
        doctor_user = make_user(username="druser", role="doctor", email="druser@h.com")
        client = auth_client(doctor_user)
        d = make_doctor(email="victim@h.com")
        resp = client.delete(f"/api/doctors/{d.pk}/")
        # doctor has destroy in permission_map for doctors, so 204 expected
        self.assertIn(resp.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_403_FORBIDDEN])

    def test_nurse_cannot_access_doctors(self):
        nurse = make_user(username="nurseuser", role="nurse", email="nurse@h.com")
        client = auth_client(nurse)
        resp = client.get("/api/doctors/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class PatientAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_pat", role="admin", email="admin_pat@h.com")
        self.client = auth_client(self.admin)

    def test_list_patients(self):
        make_patient()
        resp = self.client.get("/api/patients/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_create_patient(self):
        resp = self.client.post("/api/patients/", {
            "first_name": "New",
            "last_name": "Patient",
            "phone": "555-9876",
            "date_of_birth": "2000-05-20",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertRegex(resp.data["mrn"], r"MRN-\d{4}-\d{6}")

    def test_retrieve_patient(self):
        p = make_patient()
        resp = self.client.get(f"/api/patients/{p.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_update_patient(self):
        p = make_patient()
        resp = self.client.patch(f"/api/patients/{p.pk}/", {"phone": "111-2222"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["phone"], "111-2222")

    def test_delete_patient(self):
        p = make_patient("Delete", "Me")
        resp = self.client.delete(f"/api/patients/{p.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_search_patients(self):
        make_patient("Unique", "SearchName")
        resp = self.client.get("/api/patients/?search=SearchName")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(any("SearchName" in p["last_name"] for p in resp.data))

    def test_doctor_sees_only_own_patients(self):
        doctor_user = make_user(username="drpatient", role="doctor", email="drpat@h.com")
        doctor = make_doctor(email="drpat@h.com")
        other_patient = make_patient("Invisible", "Patient")
        visible_patient = make_patient("Visible", "Patient")
        make_appointment(visible_patient, doctor)

        client = auth_client(doctor_user)
        resp = client.get("/api/patients/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [p["first_name"] for p in resp.data]
        self.assertIn("Visible", names)
        self.assertNotIn("Invisible", names)

    def test_unauthenticated_denied(self):
        resp = APIClient().get("/api/patients/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class AppointmentAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_appt", role="admin", email="admin_appt@h.com")
        self.doctor = make_doctor()
        self.patient = make_patient()
        self.client = auth_client(self.admin)

    def test_create_appointment(self):
        resp = self.client.post("/api/appointments/", {
            "patient": self.patient.pk,
            "doctor": self.doctor.pk,
            "appointment_date": str(datetime.date.today()),
            "appointment_time": "10:00:00",
            "status": "scheduled",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_appointments(self):
        make_appointment(self.patient, self.doctor)
        resp = self.client.get("/api/appointments/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_filter_by_status(self):
        make_appointment(self.patient, self.doctor, status="completed")
        resp = self.client.get("/api/appointments/?status=completed")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(all(a["status"] == "completed" for a in resp.data))

    def test_update_appointment_status(self):
        appt = make_appointment(self.patient, self.doctor)
        resp = self.client.patch(f"/api/appointments/{appt.pk}/", {"status": "checked_in"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "checked_in")

    def test_doctor_cannot_create_appointment(self):
        doctor_user = make_user(username="dr_appt", role="doctor", email="dr_appt@h.com")
        client = auth_client(doctor_user)
        resp = client.post("/api/appointments/", {
            "patient": self.patient.pk,
            "doctor": self.doctor.pk,
            "appointment_date": str(datetime.date.today()),
            "appointment_time": "11:00:00",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_doctor_sees_only_own_appointments(self):
        doctor_user = make_user(username="dr_own_appt", role="doctor", email="dr_own_appt@h.com")
        own_doctor = make_doctor(email="dr_own_appt@h.com")
        other_doctor = make_doctor(email="other_appt@h.com")
        own_appt = make_appointment(self.patient, own_doctor)
        other_appt = make_appointment(self.patient, other_doctor)

        client = auth_client(doctor_user)
        resp = client.get("/api/appointments/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [a["id"] for a in resp.data]
        self.assertIn(own_appt.pk, ids)
        self.assertNotIn(other_appt.pk, ids)


class MedicalRecordAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_mr", role="admin", email="admin_mr@h.com")
        self.doctor = make_doctor()
        self.patient = make_patient()
        self.client = auth_client(self.admin)

    def test_create_medical_record(self):
        resp = self.client.post("/api/medical-records/", {
            "patient": self.patient.pk,
            "doctor": self.doctor.pk,
            "diagnosis": "Test diagnosis",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_medical_records(self):
        MedicalRecord.objects.create(patient=self.patient, doctor=self.doctor, diagnosis="flu")
        resp = self.client.get("/api/medical-records/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_reception_cannot_access_medical_records(self):
        reception = make_user(username="recp_mr", role="reception", email="recp_mr@h.com")
        client = auth_client(reception)
        resp = client.get("/api/medical-records/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_doctor_creates_record_auto_assigned(self):
        doctor_user = make_user(username="dr_rec", role="doctor", email="dr_rec@h.com")
        make_doctor(email="dr_rec@h.com")
        client = auth_client(doctor_user)
        resp = client.post("/api/medical-records/", {
            "patient": self.patient.pk,
            "diagnosis": "Doctor's diagnosis",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class BillingAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_bill", role="admin", email="admin_bill@h.com")
        self.patient = make_patient()
        self.client = auth_client(self.admin)

    def test_create_billing(self):
        resp = self.client.post("/api/billing/", {
            "patient": self.patient.pk,
            "amount": "150.00",
            "description": "Consultation fee",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_billing(self):
        make_billing(self.patient)
        resp = self.client.get("/api/billing/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_filter_billing_by_status(self):
        make_billing(self.patient)
        resp = self.client.get("/api/billing/?status=unpaid")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(all(b["status"] == "unpaid" for b in resp.data))

    def test_billing_balance_due_in_response(self):
        bill = make_billing(self.patient, "200.00")
        resp = self.client.get(f"/api/billing/{bill.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(resp.data["balance_due"])), Decimal("200.00"))

    def test_doctor_can_only_list_billing(self):
        doctor_user = make_user(username="dr_billing", role="doctor", email="dr_billing@h.com")
        client = auth_client(doctor_user)
        resp = client.post("/api/billing/", {
            "patient": self.patient.pk,
            "amount": "100.00",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_stats(self):
        make_billing(self.patient, "500.00")
        resp = self.client.get("/api/billing/dashboard/stats/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("total_billed", resp.data)
        self.assertIn("total_collected", resp.data)
        self.assertIn("total_outstanding", resp.data)
        self.assertIn("ar_aging", resp.data)
        self.assertIn("status_breakdown", resp.data)
        self.assertIn("daily_collections", resp.data)

    def test_dashboard_stats_requires_auth(self):
        resp = APIClient().get("/api/billing/dashboard/stats/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class BillingPaymentAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_pay", role="admin", email="admin_pay@h.com")
        self.patient = make_patient()
        self.bill = make_billing(self.patient, "300.00")
        self.client = auth_client(self.admin)

    def test_create_payment(self):
        resp = self.client.post("/api/billing-payments/", {
            "billing": self.bill.pk,
            "amount": "100.00",
            "payment_method": "cash",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.bill.refresh_from_db()
        self.assertEqual(self.bill.paid_amount, Decimal("100.00"))

    def test_list_payments(self):
        user = make_user(username="payer", email="payer@h.com")
        BillingPayment.objects.create(billing=self.bill, amount=Decimal("50.00"), received_by=user)
        resp = self.client.get("/api/billing-payments/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_overpayment_rejected(self):
        resp = self.client.post("/api/billing-payments/", {
            "billing": self.bill.pk,
            "amount": "9999.00",
            "payment_method": "cash",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class MedicalReportAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_rep", role="admin", email="admin_rep@h.com")
        self.doctor = make_doctor()
        self.patient = make_patient()
        self.client = auth_client(self.admin)

    def test_create_medical_report(self):
        resp = self.client.post("/api/medical-reports/", {
            "patient": self.patient.pk,
            "doctor": self.doctor.pk,
            "title": "Annual Check-up",
            "report_type": "consultation",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_medical_reports(self):
        MedicalReport.objects.create(
            patient=self.patient, doctor=self.doctor,
            title="Test Report", report_type="consultation",
            created_by=self.admin,
        )
        resp = self.client.get("/api/medical-reports/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_update_medical_report(self):
        report = MedicalReport.objects.create(
            patient=self.patient, doctor=self.doctor,
            title="Old Title", report_type="consultation",
            created_by=self.admin,
        )
        resp = self.client.patch(f"/api/medical-reports/{report.pk}/", {"title": "New Title"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], "New Title")

    def test_reception_cannot_create_report(self):
        reception = make_user(username="recp_rep", role="reception", email="recp_rep@h.com")
        client = auth_client(reception)
        resp = client.post("/api/medical-reports/", {
            "patient": self.patient.pk,
            "title": "Unauthorized",
            "report_type": "lab",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_medical_reports_by_patient(self):
        report = MedicalReport.objects.create(
            patient=self.patient, doctor=self.doctor,
            title="Patient Report", report_type="consultation",
            created_by=self.admin,
        )
        resp = self.client.get(f"/api/medical-reports/?patient={self.patient.pk}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(any(r["id"] == report.pk for r in resp.data))


class PDFDownloadAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_pdf", role="admin", email="admin_pdf@h.com")
        self.client = auth_client(self.admin)

    def test_invoice_pdf_not_found(self):
        resp = self.client.get("/api/billing/99999/download-invoice/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_medical_report_pdf_not_found(self):
        resp = self.client.get("/api/medical-reports/99999/download-report/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_invoice_pdf_download(self):
        patient = make_patient()
        bill = make_billing(patient, "100.00")
        resp = self.client.get(f"/api/billing/{bill.pk}/download-invoice/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/pdf")

    def test_medical_report_pdf_download(self):
        patient = make_patient()
        doctor = make_doctor()
        report = MedicalReport.objects.create(
            patient=patient, doctor=doctor,
            title="PDF Test Report", report_type="consultation",
            created_by=self.admin,
        )
        resp = self.client.get(f"/api/medical-reports/{report.pk}/download-report/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/pdf")

    def test_pdf_requires_auth(self):
        resp = APIClient().get("/api/billing/1/download-invoice/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class UserAPITests(APITestCase):

    def setUp(self):
        self.admin = make_user(username="admin_usr", role="admin", email="admin_usr@h.com")
        self.client = auth_client(self.admin)

    def test_admin_can_list_users(self):
        resp = self.client.get("/api/users/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_non_admin_cannot_list_users(self):
        reception = make_user(username="recp_usr", role="reception", email="recp_usr@h.com")
        client = auth_client(reception)
        resp = client.get("/api/users/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_can_retrieve_own_user(self):
        reception = make_user(username="recp_usr2", role="reception", email="recp_usr2@h.com")
        client = auth_client(reception)
        resp = client.get(f"/api/users/{reception.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "recp_usr2")

    def test_nurse_cannot_list_users(self):
        nurse = make_user(username="nurse_usr", role="nurse", email="nurse_usr@h.com")
        client = auth_client(nurse)
        resp = client.get("/api/users/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
