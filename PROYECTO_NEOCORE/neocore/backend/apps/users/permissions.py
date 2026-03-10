"""
Custom permissions for NeoCore.
"""

from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of an object or admins to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_admin_role or request.user.is_staff:
            return True
        
        # Users can only access their own data
        return obj == request.user


class IsProfessional(permissions.BasePermission):
    """
    Permission to only allow professional users.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_professional


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin_role or request.user.is_staff
        )


class IsClient(permissions.BasePermission):
    """
    Permission to only allow client users.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_client
