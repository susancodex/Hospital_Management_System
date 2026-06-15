from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_promote_superusers_to_admin'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='google_sub',
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
    ]
