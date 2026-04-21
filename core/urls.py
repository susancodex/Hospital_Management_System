from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserViewSet, DoctorViewSet, PatientViewSet,
    AppointmentViewSet, MedicalRecordViewSet, BillingViewSet,
    CustomTokenObtainPairView, current_user, register,
    forgot_password, change_password, profile,
)

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('doctors', DoctorViewSet)
router.register('patients', PatientViewSet)
router.register('appointments', AppointmentViewSet)
router.register('medical-records', MedicalRecordViewSet)
router.register('billing', BillingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register, name='register'),
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('change-password/', change_password, name='change_password'),
    path('profile/', profile, name='profile'),
    path('users/me/', current_user, name='current_user'),
]
