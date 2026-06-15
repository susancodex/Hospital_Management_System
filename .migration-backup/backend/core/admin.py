from django.contrib import admin
from .models import User, Doctor, Patient, Appointment, MedicalRecord, MedicalReport, Billing, BillingPayment

admin.site.register(User)
admin.site.register(Doctor)
admin.site.register(Patient)
admin.site.register(Appointment)
admin.site.register(MedicalRecord)
admin.site.register(MedicalReport)
admin.site.register(Billing)
admin.site.register(BillingPayment)