from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, time, timedelta
import random
from decimal import Decimal

from core.models import User, Doctor, Patient, Appointment, MedicalRecord, Billing


class Command(BaseCommand):
    help = 'Seed the database with demo data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # Create users
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin', password='admin123',
                email='admin@medcare.com', first_name='Admin', last_name='User',
                role='admin'
            )

        if not User.objects.filter(username='doctor1').exists():
            User.objects.create_user(
                username='doctor1', password='doctor123',
                email='doctor1@medcare.com', first_name='Sarah', last_name='Johnson',
                role='doctor'
            )

        if not User.objects.filter(username='reception1').exists():
            User.objects.create_user(
                username='reception1', password='reception123',
                email='reception@medcare.com', first_name='Emily', last_name='Chen',
                role='reception'
            )

        self.stdout.write('  Users created.')

        # Create doctors
        doctors_data = [
            ('Sarah', 'Johnson', 'sarah.johnson@medcare.com', '+1-555-0101', 'Cardiology', 'MD-001'),
            ('Michael', 'Williams', 'michael.w@medcare.com', '+1-555-0102', 'Neurology', 'MD-002'),
            ('Priya', 'Patel', 'priya.patel@medcare.com', '+1-555-0103', 'Pediatrics', 'MD-003'),
            ('James', 'Chen', 'james.chen@medcare.com', '+1-555-0104', 'Orthopedics', 'MD-004'),
            ('Linda', 'Martinez', 'linda.m@medcare.com', '+1-555-0105', 'Dermatology', 'MD-005'),
        ]
        doctors = []
        for fn, ln, email, phone, spec, lic in doctors_data:
            doc, _ = Doctor.objects.get_or_create(
                email=email,
                defaults=dict(first_name=fn, last_name=ln, phone=phone,
                              specialization=spec, license_number=lic)
            )
            doctors.append(doc)

        self.stdout.write('  Doctors created.')

        # Create patients
        patients_data = [
            ('Alice', 'Thompson', 'alice.t@email.com', '+1-555-1001', date(1985, 3, 15), 'F', '123 Oak St, NY'),
            ('Robert', 'Davis', 'robert.d@email.com', '+1-555-1002', date(1972, 7, 22), 'M', '456 Pine Ave, CA'),
            ('Maria', 'Garcia', 'maria.g@email.com', '+1-555-1003', date(1990, 11, 8), 'F', '789 Elm Rd, TX'),
            ('John', 'Wilson', 'john.w@email.com', '+1-555-1004', date(1965, 5, 30), 'M', '321 Maple Dr, FL'),
            ('Jennifer', 'Anderson', 'jennifer.a@email.com', '+1-555-1005', date(1998, 1, 17), 'F', '654 Cedar Ln, WA'),
            ('David', 'Taylor', 'david.t@email.com', '+1-555-1006', date(1955, 9, 12), 'M', '987 Birch Blvd, IL'),
            ('Susan', 'Moore', 'susan.m@email.com', '+1-555-1007', date(1980, 4, 25), 'F', '147 Spruce Way, OH'),
            ('Thomas', 'Jackson', 'thomas.j@email.com', '+1-555-1008', date(2001, 6, 3), 'M', '258 Willow Ct, GA'),
        ]
        patients = []
        for fn, ln, email, phone, dob, gender, addr in patients_data:
            p, _ = Patient.objects.get_or_create(
                email=email,
                defaults=dict(first_name=fn, last_name=ln, phone=phone,
                              date_of_birth=dob, gender=gender, address=addr)
            )
            patients.append(p)

        self.stdout.write('  Patients created.')

        # Create appointments
        today = date.today()
        appointment_data = [
            (patients[0], doctors[0], today, time(9, 0), 'scheduled', 'Routine cardiac checkup'),
            (patients[1], doctors[1], today, time(10, 30), 'completed', 'Follow-up for migraines'),
            (patients[2], doctors[2], today, time(11, 0), 'scheduled', 'Child vaccination'),
            (patients[3], doctors[3], today - timedelta(days=1), time(14, 0), 'completed', 'Knee pain consultation'),
            (patients[4], doctors[4], today - timedelta(days=2), time(9, 30), 'completed', 'Skin rash examination'),
            (patients[5], doctors[0], today + timedelta(days=1), time(10, 0), 'scheduled', 'Hypertension management'),
            (patients[6], doctors[1], today + timedelta(days=2), time(15, 0), 'scheduled', 'Neurological assessment'),
            (patients[7], doctors[2], today - timedelta(days=3), time(8, 0), 'cancelled', 'Annual physical'),
            (patients[0], doctors[3], today - timedelta(days=7), time(11, 30), 'completed', 'Shoulder pain'),
            (patients[1], doctors[4], today + timedelta(days=3), time(13, 0), 'scheduled', 'Eczema treatment'),
        ]
        appointments = []
        for patient, doctor, appt_date, appt_time, status, notes in appointment_data:
            appt = Appointment.objects.create(
                patient=patient, doctor=doctor,
                appointment_date=appt_date, appointment_time=appt_time,
                status=status, notes=notes
            )
            appointments.append(appt)

        self.stdout.write('  Appointments created.')

        # Create medical records
        records_data = [
            (patients[0], doctors[0], date(2024, 12, 1), 'Hypertension Stage 1', 'Amlodipine 5mg daily', 'Blood pressure 145/90'),
            (patients[1], doctors[1], date(2025, 1, 15), 'Chronic migraine', 'Sumatriptan as needed', 'Avoid triggers: bright light, stress'),
            (patients[2], doctors[2], date(2025, 2, 20), 'Common cold', 'Rest and fluids', 'Fully recovered'),
            (patients[3], doctors[3], date(2025, 3, 5), 'Osteoarthritis of right knee', 'Physical therapy + NSAIDs', 'X-ray shows moderate degeneration'),
            (patients[4], doctors[4], date(2025, 3, 18), 'Contact dermatitis', 'Hydrocortisone cream 1%', 'Avoid allergen: nickel'),
            (patients[5], doctors[0], date(2025, 4, 2), 'Type 2 Diabetes', 'Metformin 500mg twice daily', 'HbA1c: 7.2%'),
            (patients[6], doctors[1], date(2025, 4, 10), 'Tension headache', 'Ibuprofen 400mg', 'Stress management recommended'),
        ]
        medical_records = []
        for patient, doctor, rec_date, diagnosis, treatment, notes in records_data:
            rec = MedicalRecord.objects.create(
                patient=patient, doctor=doctor, record_date=rec_date,
                diagnosis=diagnosis, treatment=treatment, notes=notes
            )
            medical_records.append(rec)

        self.stdout.write('  Medical records created.')

        # Create billing
        billing_data = [
            (patients[0], appointments[0], Decimal('250.00'), 'paid', 'Cardiac consultation'),
            (patients[1], appointments[1], Decimal('180.00'), 'paid', 'Neurology follow-up'),
            (patients[2], appointments[2], Decimal('120.00'), 'unpaid', 'Pediatric visit + vaccines'),
            (patients[3], appointments[3], Decimal('350.00'), 'paid', 'Orthopedic consultation + X-ray'),
            (patients[4], appointments[4], Decimal('200.00'), 'paid', 'Dermatology examination'),
            (patients[5], appointments[5], Decimal('275.00'), 'unpaid', 'Cardiology appointment'),
            (patients[6], appointments[6], Decimal('220.00'), 'partial', 'Neurology assessment'),
            (patients[7], appointments[7], Decimal('150.00'), 'unpaid', 'Cancelled appointment fee'),
        ]
        for patient, appointment, amount, status, desc in billing_data:
            Billing.objects.create(
                patient=patient, appointment=appointment,
                amount=amount, status=status, description=desc
            )

        self.stdout.write('  Billing records created.')
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Demo credentials:')
        self.stdout.write('  Admin:     admin / admin123')
        self.stdout.write('  Doctor:    doctor1 / doctor123')
        self.stdout.write('  Reception: reception1 / reception123')
