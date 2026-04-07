from django.db import migrations
import encrypted_model_fields.fields


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='cancellation_reason',
            field=encrypted_model_fields.fields.EncryptedTextField(blank=True, verbose_name='cancellation reason'),
        ),
        migrations.AlterField(
            model_name='booking',
            name='client_notes',
            field=encrypted_model_fields.fields.EncryptedTextField(blank=True, help_text='Notes from client to professional', verbose_name='client notes'),
        ),
        migrations.AlterField(
            model_name='booking',
            name='professional_notes',
            field=encrypted_model_fields.fields.EncryptedTextField(blank=True, help_text='Internal notes by professional', verbose_name='professional notes'),
        ),
    ]
