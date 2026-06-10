from django.db import migrations, models
import encrypted_model_fields.fields


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='gdpr_consent',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='gdpr_consent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='last_activity_at',
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='user',
            name='bio',
            field=encrypted_model_fields.fields.EncryptedTextField(blank=True, verbose_name='biography'),
        ),
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=encrypted_model_fields.fields.EncryptedCharField(blank=True, max_length=20, verbose_name='phone number'),
        ),
    ]
