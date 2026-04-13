"""
Tests del modelo Service.

Cubre:
  - Creación y valores por defecto
  - Campos: name, description, duration_minutes, price, is_active
  - Propiedad available_professionals_count
  - Relación ManyToMany con profesionales
  - Representación en texto (__str__)
  - Campos de auditoría
"""

import pytest
from django.contrib.auth import get_user_model
from apps.services.models import Service

User = get_user_model()


@pytest.mark.django_db
class TestServiceCreation:
    """Tests de creación básica de servicios."""

    def test_servicio_se_crea_correctamente(self, service):
        assert service.pk is not None
        assert service.name == "Fisioterapia Deportiva"

    def test_is_active_por_defecto_true(self, db):
        s = Service.objects.create(
            name="Nuevo Servicio",
            description="Descripcion",
            duration_minutes=30,
        )
        assert s.is_active is True

    def test_precio_puede_ser_null(self, db):
        s = Service.objects.create(
            name="Servicio Sin Precio",
            description="Descripcion",
            duration_minutes=45,
            price=None,
        )
        assert s.price is None

    def test_imagen_puede_ser_null(self, service):
        assert not service.image

    def test_campos_de_auditoria_existen(self, service):
        assert service.created_at is not None
        assert service.updated_at is not None


@pytest.mark.django_db
class TestServiceStr:
    """Tests de la representación en texto del servicio."""

    def test_str_contiene_nombre_y_duracion(self, service):
        texto = str(service)
        assert "Fisioterapia Deportiva" in texto
        assert "60" in texto

    def test_str_formato_correcto(self, db):
        s = Service.objects.create(
            name="Nutricion",
            description="Consulta nutricional",
            duration_minutes=45,
        )
        assert str(s) == "Nutricion (45 min)"


@pytest.mark.django_db
class TestServiceProfessionals:
    """Tests de la relación ManyToMany con profesionales."""

    def test_servicio_sin_profesionales(self, service):
        assert service.professionals.count() == 0
        assert service.available_professionals_count == 0

    def test_servicio_con_un_profesional_activo(self, service, professional_user):
        service.professionals.add(professional_user)
        assert service.available_professionals_count == 1

    def test_servicio_no_cuenta_profesional_inactivo(self, service, create_user):
        prof_inactivo = create_user(
            email="inactivo@prof.com",
            role=User.Role.PROFESSIONAL,
            is_active=False,
        )
        service.professionals.add(prof_inactivo)
        assert service.available_professionals_count == 0

    def test_multiples_profesionales(self, service, professional_user, create_user):
        prof2 = create_user(
            email="prof2@example.com",
            role=User.Role.PROFESSIONAL,
        )
        service.professionals.add(professional_user, prof2)
        assert service.available_professionals_count == 2


@pytest.mark.django_db
class TestServiceOrdering:
    """Tests del orden por defecto de servicios."""

    def test_servicios_ordenados_alfabeticamente(self, db):
        Service.objects.create(name="Yoga", description="d", duration_minutes=60)
        Service.objects.create(name="Acupuntura", description="d", duration_minutes=45)
        Service.objects.create(name="Masaje", description="d", duration_minutes=30)
        names = list(Service.objects.values_list('name', flat=True))
        assert names == sorted(names)
