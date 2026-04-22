from django.db import migrations, models

def set_default_times(apps, schema_editor):
    Appointment = apps.get_model("core", "Appointment")
    Appointment.objects.filter(appointment_time__isnull=True).update(appointment_time="00:00:00")

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_user_phone_user_profile_picture"),
    ]

    operations = [
        migrations.AlterField(
            model_name="appointment",
            name="appointment_time",
            field=models.TimeField(null=False, default="00:00:00"),
            preserve_default=False,
        ),
    ]
