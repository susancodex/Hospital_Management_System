from django.contrib.contenttypes.models import ContentType
from .models import AuditLog
import json


def log_action(user, action, instance, field_name=None, old_value=None, new_value=None, request=None):
    """
    Log an action performed on a model instance
    """
    content_type = ContentType.objects.get_for_model(instance)
    
    log = AuditLog(
        user=user,
        action=action,
        content_type=content_type,
        object_id=instance.pk,
        field_name=field_name or '',
        old_value=json.dumps(old_value) if old_value is not None else None,
        new_value=json.dumps(new_value) if new_value is not None else None,
    )
    
    if request:
        log.ip_address = request.META.get('REMOTE_ADDR')
        log.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    log.save()
    return log


class AuditLogMiddleware:
    """
    Middleware to attach audit logging to request
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.audit_log = lambda action, instance, **kwargs: log_action(
            request.user, action, instance, request=request, **kwargs
        )
        return self.get_response(request)
