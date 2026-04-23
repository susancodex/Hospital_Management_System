from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_add_patient_role_and_profile_link'),
    ]

    operations = [
        migrations.AddField(
            model_name='billingpayment',
            name='gateway',
            field=models.CharField(choices=[('manual', 'Manual'), ('esewa', 'eSewa'), ('bank', 'Bank Transfer')], default='manual', max_length=20),
        ),
        migrations.AddField(
            model_name='billingpayment',
            name='gateway_payload',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='billingpayment',
            name='gateway_transaction_id',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='billingpayment',
            name='transaction_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('verified', 'Verified'), ('failed', 'Failed')], default='verified', max_length=20),
        ),
        migrations.AddField(
            model_name='billingpayment',
            name='verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='billingpayment',
            name='payment_method',
            field=models.CharField(choices=[('cash', 'Cash'), ('card', 'Card'), ('bank', 'Bank Transfer'), ('upi', 'UPI'), ('esewa', 'eSewa'), ('insurance', 'Insurance')], default='cash', max_length=20),
        ),
    ]
