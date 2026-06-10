from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.http import JsonResponse
from django.views.generic import View
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdmin


class PublicAccessMixin(UserPassesTestMixin):
    def test_func(self):
        return True


class PublicDashboardView(PublicAccessMixin, View):
    def get(self, request, *args, **kwargs):
        return JsonResponse(
            {
                "scope": "public",
                "message": "Vista pública accesible por usuarios anónimos y autenticados.",
            }
        )


class AuthenticatedDashboardView(LoginRequiredMixin, View):
    login_url = "/admin/login/"

    def get(self, request, *args, **kwargs):
        return JsonResponse(
            {
                "scope": "authenticated",
                "message": "Vista solo para usuarios autenticados.",
                "user": request.user.email,
            }
        )


class AdminDashboardView(LoginRequiredMixin, UserPassesTestMixin, View):
    login_url = "/admin/login/"

    def test_func(self):
        return bool(
            self.request.user.is_authenticated
            and (
                getattr(self.request.user, "is_admin_role", False)
                or self.request.user.is_staff
                or self.request.user.is_superuser
            )
        )

    def get(self, request, *args, **kwargs):
        return JsonResponse(
            {
                "scope": "admin",
                "message": "Vista solo para administradores.",
                "user": request.user.email,
            }
        )


class PublicStatusAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "scope": "public",
                "message": "API pública accesible por cualquier usuario.",
            }
        )


class AuthenticatedUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"username": request.user.username})


class AdminOnlyAPIView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(
            {
                "scope": "admin",
                "message": "API solo para administradores.",
                "user": request.user.email,
            }
        )
