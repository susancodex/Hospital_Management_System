from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserViewSet, DoctorViewSet, PatientViewSet,
    AppointmentViewSet, MedicalRecordViewSet, MedicalReportViewSet,
    BillingViewSet, BillingPaymentViewSet,
    CustomTokenObtainPairView, current_user, register,
    forgot_password, change_password, profile, google_login, auth_config,
    download_invoice_pdf, download_medical_report_pdf, billing_dashboard_stats,
)

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('doctors', DoctorViewSet)
router.register('patients', PatientViewSet)
router.register('appointments', AppointmentViewSet)
router.register('medical-records', MedicalRecordViewSet)
router.register('medical-reports', MedicalReportViewSet)
router.register('billing', BillingViewSet)
router.register('billing-payments', BillingPaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth-config/', auth_config, name='auth_config'),
    path('register/', register, name='register'),
    path('google-login/', google_login, name='google_login'),
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('change-password/', change_password, name='change_password'),
    path('profile/', profile, name='profile'),
    path('users/me/', current_user, name='current_user'),
    path('billing/<int:billing_id>/download-invoice/', download_invoice_pdf, name='download_invoice'),
    path('medical-reports/<int:report_id>/download-report/', download_medical_report_pdf, name='download_report'),
    path('billing/dashboard/stats/', billing_dashboard_stats, name='billing_dashboard_stats'),
]


