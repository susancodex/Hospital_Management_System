from django.db import migrations


def promote_superusers_to_admin(apps, schema_editor):
    User = apps.get_model('core', 'User')
    User.objects.filter(is_superuser=True).exclude(role='admin').update(role='admin')


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_billing_due_date_billing_insurance_claim_number_and_more'),
    ]

    operations = [
        migrations.RunPython(promote_superusers_to_admin, migrations.RunPython.noop),
    ]
