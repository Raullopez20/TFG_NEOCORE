"""
Tests de los serializadores de servicios.

Cubre:
  - ServiceListSerializer: campos ligeros para listado
  - ServiceSerializer: campos completos con profesionales
  - ServiceAdminSerializer: validaciones de nombre e imagen
"""

import pytest
from apps.services.models import Service
from apps.services.serializers import (
    ServiceListSerializer,
    ServiceSerializer,
    ServiceAdminSerializer,
)


@pytest.mark.django_db
class TestServiceListSerializer:
    """Tests del serializador ligero para listados."""

    def test_contiene_campos_esperados(self, service):
        data = ServiceListSerializer(service).data
        for campo in ['id', 'name', 'description', 'duration_minutes', 'price',
                      'available_professionals_count']:
            assert campo in data

    def test_no_contiene_profesionales_anidados(self, service):
        data = ServiceListSerializer(service).data
        assert 'professionals_list' not in data

    def test_available_professionals_count_es_cero(self, service):
        data = ServiceListSerializer(service).data
        assert data['available_professionals_count'] == 0

    def test_precio_correcto(self, service):
        data = ServiceListSerializer(service).data
        assert str(data['price']) == "45.00"


@pytest.mark.django_db
class TestServiceSerializer:
    """Tests del serializador completo con profesionales."""

    def test_contiene_professionals_list(self, service):
        data = ServiceSerializer(service).data
        assert 'professionals_list' in data

    def test_professionals_list_vacia_por_defecto(self, service):
        data = ServiceSerializer(service).data
        assert data['professionals_list'] == []

    def test_professionals_list_con_profesional(self, service, professional_user):
        service.professionals.add(professional_user)
        data = ServiceSerializer(service).data
        assert len(data['professionals_list']) == 1
        assert 'full_name' in data['professionals_list'][0]

    def test_contiene_campos_de_auditoria(self, service):
        data = ServiceSerializer(service).data
        assert 'created_at' in data
        assert 'updated_at' in data


@pytest.mark.django_db
class TestServiceAdminSerializer:
    """Tests del serializador de administración con validaciones."""

    def test_nombre_valido_pasa_validacion(self):
        data = {
            'name': 'Masaje Deportivo',
            'description': 'Descripcion del servicio',
            'duration_minutes': 60,
        }
        serializer = ServiceAdminSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_nombre_con_caracteres_invalidos_falla(self):
        data = {
            'name': 'Servicio <script>',
            'description': 'Descripcion',
            'duration_minutes': 60,
        }
        serializer = ServiceAdminSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_nombre_demasiado_corto_falla(self):
        data = {
            'name': 'AB',
            'description': 'Descripcion',
            'duration_minutes': 60,
        }
        serializer = ServiceAdminSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_descripcion_demasiado_larga_falla(self):
        data = {
            'name': 'Servicio Valido',
            'description': 'x' * 3001,
            'duration_minutes': 60,
        }
        serializer = ServiceAdminSerializer(data=data)
        assert not serializer.is_valid()
        assert 'description' in serializer.errors

    def test_descripcion_exactamente_3000_caracteres_pasa(self):
        data = {
            'name': 'Servicio Valido',
            'description': 'x' * 3000,
            'duration_minutes': 60,
        }
        serializer = ServiceAdminSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_duracion_obligatoria(self):
        data = {
            'name': 'Servicio Valido',
            'description': 'Descripcion',
        }
        serializer = ServiceAdminSerializer(data=data)
        assert not serializer.is_valid()
        assert 'duration_minutes' in serializer.errors

    def test_html_en_nombre_es_sanitizado(self):
        data = {
            'name': 'Servicio Bueno',
            'description': 'Descripcion limpia',
            'duration_minutes': 45,
        }
        serializer = ServiceAdminSerializer(data=data)
        assert serializer.is_valid()
