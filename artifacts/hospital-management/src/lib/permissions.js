const ROLE_PERMISSIONS = {
  admin: new Set([
    'dashboard.view',
    'doctors.view',
    'doctors.manage',
    'patients.view',
    'patients.manage',
    'appointments.view',
    'appointments.manage',
    'medicalRecords.view',
    'medicalRecords.manage',
    'medicalReports.view',
    'medicalReports.manage',
    'aiInsights.view',
    'billing.view',
    'billing.manage',
    'profile.view',
  ]),
  doctor: new Set([
    'dashboard.view',
    'doctors.view',
    'doctors.manage',
    'patients.view',
    'patients.manage',
    'appointments.view',
    'appointments.update',
    'appointments.manage',
    'medicalRecords.view',
    'medicalRecords.manage',
    'medicalReports.view',
    'medicalReports.manage',
    'aiInsights.view',
    'billing.view',
    'profile.view',
  ]),
  patient: new Set([
    'dashboard.view',
    'patients.view',
    'appointments.view',
    'medicalRecords.view',
    'medicalReports.view',
    'billing.view',
    'profile.view',
  ]),
  reception: new Set([
    'dashboard.view',
    'doctors.view',
    'doctors.manage',
    'patients.view',
    'patients.manage',
    'appointments.view',
    'appointments.manage',
    'medicalReports.view',
    'aiInsights.view',
    'billing.view',
    'billing.manage',
    'profile.view',
  ]),
};

export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  // Temporarily show all sections for admin
  if (role === 'admin') return true;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
};
