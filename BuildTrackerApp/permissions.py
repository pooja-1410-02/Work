# permissions.py
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Custom permission to only allow admin users to access certain views.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser

class IsAuthenticated(BasePermission):
    """
    Custom permission to only allow authenticated users to access views.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
