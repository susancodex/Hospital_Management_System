from rest_framework.permissions import BasePermission


def get_doctor_profile_for_user(user, DoctorModel):
    """Resolve a doctor's profile from the authenticated user.

    This keeps compatibility with existing data by matching doctor.email to user.email.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return None

    email = (getattr(user, 'email', '') or '').strip()
    if not email:
        return None

    return DoctorModel.objects.filter(email__iexact=email).first()


class RoleActionPermission(BasePermission):
    """Granular role/action guard for DRF viewsets.

    Each viewset defines `permission_map` as:
    {
      'admin': {'list', 'retrieve', 'create', ...},
      'doctor': {'list', 'retrieve'},
      'reception': {'list', 'retrieve'}
    }
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        permission_map = getattr(view, 'permission_map', {})
        role = getattr(request.user, 'role', None)
        if role not in permission_map:
            return False

        allowed_actions = permission_map.get(role, set())
        action = getattr(view, 'action', None)
        return action in allowed_actions
