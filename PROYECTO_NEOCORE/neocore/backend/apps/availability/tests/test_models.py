"""
Tests de los modelos AvailabilityRule y TimeOff.

Cubre:
  - Creación y validaciones de AvailabilityRule
  - Creación y validaciones de TimeOff
  - unique_together en AvailabilityRule
  - Representación en texto (__str__)
  - Orden por defecto
"""

import pytest
from datetime import date, time, timedelta
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from apps.availability.models import AvailabilityRule, TimeOff

User = get_user_model()


@pytest.mark.django_db
class TestAvailabilityRuleCreation:
    """Tests de creación básica de reglas de disponibilidad."""

    def test_regla_se_crea_correctamente(self, professional_user):
        rule = AvailabilityRule(
            professional=professional_user,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_active=True,
        )
        rule.save()
        assert rule.pk is not None

    def test_is_active_por_defecto_true(self, professional_user):
        rule = AvailabilityRule(
            professional=professional_user,
            day_of_week=1,
            start_time=time(10, 0),
            end_time=time(14, 0),
        )
        rule.save()
        assert rule.is_active is True

    def test_campos_de_auditoria_existen(self, professional_user):
        rule = AvailabilityRule(
            professional=professional_user,
            day_of_week=2,
            start_time=time(9, 0),
            end_time=time(13, 0),
        )
        rule.save()
        assert rule.created_at is not None
        assert rule.updated_at is not None


@pytest.mark.django_db
class TestAvailabilityRuleValidations:
    """Tests de validaciones del modelo AvailabilityRule."""

    def test_end_time_antes_de_start_time_falla(self, professional_user):
        rule = AvailabilityRule(
            professional=professional_user,
            day_of_week=0,
            start_time=time(17, 0),
            end_time=time(9, 0),
        )
        with pytest.raises(ValidationError):
            rule.clean()

    def test_start_igual_end_falla(self, professional_user):
        rule = AvailabilityRule(
            professional=professional_user,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(9, 0),
        )
        with pytest.raises(ValidationError):
            rule.clean()

    def test_no_profesional_falla(self, client_user):
        rule = AvailabilityRule(
            professional=client_user,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        with pytest.raises(ValidationError):
            rule.clean()

    def test_unique_together_mismo_dia_mismo_inicio(self, professional_user):
        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(13, 0),
        )
        with pytest.raises(Exception):
            AvailabilityRule.objects.create(
                professional=professional_user,
                day_of_week=0,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )

    def test_mismo_dia_distinta_hora_inicio_permitido(self, professional_user):
        AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(13, 0),
        )
        rule2 = AvailabilityRule.objects.create(
            professional=professional_user,
            day_of_week=0,
            start_time=time(14, 0),
            end_time=time(18, 0),
        )
        assert rule2.pk is not None


@pytest.mark.django_db
class TestAvailabilityRuleStr:
    """Tests de la representación en texto."""

    def test_str_contiene_nombre_y_dia(self, professional_user):
        rule = AvailabilityRule(
            professional=professional_user,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        rule.save()
        texto = str(rule)
        assert professional_user.get_full_name() in texto
        # Day name can be in Spanish or English depending on locale
        assert any(day in texto.lower() for day in ["monday", "lunes"])


@pytest.mark.django_db
class TestTimeOffCreation:
    """Tests de creación de períodos de ausencia."""

    def test_time_off_se_crea_correctamente(self, professional_user):
        to = TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 8, 1),
            end_date=date(2030, 8, 15),
            reason="Vacaciones de verano",
        )
        assert to.pk is not None

    def test_mismo_dia_inicio_y_fin_permitido(self, professional_user):
        to = TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 9, 5),
            end_date=date(2030, 9, 5),
        )
        assert to.pk is not None

    def test_razon_puede_estar_vacia(self, professional_user):
        to = TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 10, 1),
            end_date=date(2030, 10, 2),
        )
        assert to.reason == ""


@pytest.mark.django_db
class TestTimeOffValidations:
    """Tests de validaciones del modelo TimeOff."""

    def test_end_date_antes_de_start_falla(self, professional_user):
        to = TimeOff(
            professional=professional_user,
            start_date=date(2030, 8, 15),
            end_date=date(2030, 8, 1),
        )
        with pytest.raises(ValidationError):
            to.clean()

    def test_no_profesional_falla(self, client_user):
        to = TimeOff(
            professional=client_user,
            start_date=date(2030, 8, 1),
            end_date=date(2030, 8, 5),
        )
        with pytest.raises(ValidationError):
            to.clean()


@pytest.mark.django_db
class TestTimeOffStr:
    """Tests de la representación en texto de TimeOff."""

    def test_str_mismo_dia(self, professional_user):
        to = TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 8, 5),
            end_date=date(2030, 8, 5),
        )
        texto = str(to)
        assert professional_user.get_full_name() in texto
        assert "2030-08-05" in texto

    def test_str_rango_dias(self, professional_user):
        to = TimeOff.objects.create(
            professional=professional_user,
            start_date=date(2030, 8, 1),
            end_date=date(2030, 8, 10),
        )
        texto = str(to)
        assert "to" in texto
