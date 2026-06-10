"""
Migración: añade el modelo Review (reseña 1:1 sobre Booking).
"""

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0003_encrypt_sensitive_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.AutoField(
                    auto_created=True,
                    primary_key=True,
                    serialize=False,
                    verbose_name='ID',
                )),
                ('rating', models.PositiveSmallIntegerField(
                    help_text='Valoración de 1 a 5 estrellas',
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(5),
                    ],
                    verbose_name='rating',
                )),
                ('comment', models.TextField(blank=True, max_length=2000, verbose_name='comment')),
                ('is_visible', models.BooleanField(
                    default=True,
                    help_text='Si está oculto, no aparecerá en perfiles públicos',
                    verbose_name='visible',
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('booking', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='review',
                    to='bookings.booking',
                )),
            ],
            options={
                'verbose_name': 'review',
                'verbose_name_plural': 'reviews',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(
                fields=['is_visible', '-created_at'],
                name='bookings_re_is_visi_idx',
            ),
        ),
    ]
