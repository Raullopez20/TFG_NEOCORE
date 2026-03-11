#!/usr/bin/env python
"""
Punto de entrada principal para la línea de comandos de Django.

Este script permite ejecutar tareas administrativas del proyecto NeoCore,
como migraciones de base de datos, creación de superusuarios, ejecución
del servidor de desarrollo, y cualquier otro comando de gestión de Django.

Uso:
    python manage.py <comando> [opciones]

Ejemplos:
    python manage.py runserver          -> Inicia el servidor de desarrollo
    python manage.py migrate             -> Aplica las migraciones pendientes
    python manage.py createsuperuser     -> Crea un usuario administrador
    python manage.py seed_data           -> Carga datos de prueba iniciales
"""

import os
import sys


def main():
    """
    Función principal que configura el entorno de Django y ejecuta
    el comando proporcionado por línea de comandos.

    Establece la variable de entorno DJANGO_SETTINGS_MODULE para que
    Django sepa qué archivo de configuración utilizar (neocore.settings).
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neocore.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "No se pudo importar Django. ¿Estás seguro de que está instalado "
            "y disponible en la variable de entorno PYTHONPATH? "
            "¿Olvidaste activar el entorno virtual?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
