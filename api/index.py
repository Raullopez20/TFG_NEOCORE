"""
Vercel Python serverless entry point — NeoCore Django backend.

Handles all requests matching /api/* and /admin/* via vercel.json rewrites.
Auto-migrates on cold start. Exposes startup errors clearly instead of silent 500s.
"""

import os
import sys
import traceback

_repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend_root = os.path.join(_repo_root, "PROYECTO_NEOCORE", "neocore", "backend")

if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "neocore.settings")

_startup_error = None
_migration_error = None
_migration_output = None

try:
    import django
    django.setup()

    # Run migrations at cold start — idempotent and fast when no pending changes.
    from django.core.management import call_command
    from django.db.migrations.exceptions import InconsistentMigrationHistory
    from io import StringIO

    def _run_migrate():
        buf = StringIO()
        call_command("migrate", "--run-syncdb", interactive=False, verbosity=2, stdout=buf)
        return buf.getvalue()

    try:
        _migration_output = _run_migrate()
        _migration_error = None
    except InconsistentMigrationHistory:
        # allauth migrations were recorded before the custom users migrations.
        # Fix: remove allauth's account migrations from the history so they re-run
        # in the correct order after users.0001_initial.
        try:
            from django.db import connection
            with connection.cursor() as _cur:
                _cur.execute(
                    "DELETE FROM django_migrations WHERE app IN ('account', 'socialaccount')"
                )
            _migration_output = "FIXED inconsistent history\n" + _run_migrate()
            _migration_error = None
        except Exception:
            _migration_error = traceback.format_exc()
            _migration_output = ''
    except Exception:
        _migration_error = traceback.format_exc()
        _migration_output = ''

    # Store result in Django cache so views can read it.
    try:
        from django.core.cache import cache
        cache.set('startup:migration_output', _migration_output, timeout=3600)
        cache.set('startup:migration_error', _migration_error, timeout=3600)
    except Exception:
        pass

    from django.core.wsgi import get_wsgi_application
    _django_app = get_wsgi_application()

except Exception as _exc:
    _startup_error = traceback.format_exc()
    _django_app = None


def app(environ, start_response):
    """WSGI entry point. Returns startup error page if Django failed to initialize."""
    if _django_app is None:
        body = (
            b"Django startup failed:\n\n" +
            _startup_error.encode("utf-8", errors="replace")
        )
        start_response(
            "500 Internal Server Error",
            [
                ("Content-Type", "text/plain"),
                ("Content-Length", str(len(body))),
            ],
        )
        return [body]
    return _django_app(environ, start_response)


# Vercel also accepts 'handler' as the entrypoint name.
handler = app
