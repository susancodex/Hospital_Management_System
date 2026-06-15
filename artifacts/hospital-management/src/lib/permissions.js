const ROLE_PERMISSIONS = {
  admin: new Set([
    'dashboard.view',
    'doctors.view', 'doctors.manage',
    'patients.view', 'patients.manage',
    'appointments.view', 'appointments.manage',
    'medicalRecords.view', 'medicalRecords.manage',
    'medicalReports.view', 'medicalReports.manage',
    'aiInsights.view', 'aiInsights.manage',
    'billing.view', 'billing.manage',
    'profile.view',
    'admin.users',
    'labOrders.view', 'labOrders.manage', 'labOrders.results',
    'pharmacy.view', 'pharmacy.manage',
    'reports.view', 'reports.manage',
    'audit.view',
  ]),
  doctor: new Set([
    'dashboard.view',
    'doctors.view', 'doctors.manage',
    'patients.view', 'patients.manage',
    'appointments.view', 'appointments.update', 'appointments.manage',
    'medicalRecords.view', 'medicalRecords.manage',
    'medicalReports.view', 'medicalReports.manage',
    'aiInsights.view',
    'billing.view',
    'profile.view',
    'labOrders.view', 'labOrders.manage', 'labOrders.results',
    'pharmacy.view',
    'reports.view',
  ]),
  nurse: new Set([
    'dashboard.view',
    'patients.view', 'patients.manage',
    'appointments.view', 'appointments.update',
    'medicalRecords.view',
    'labOrders.view', 'labOrders.results',
    'profile.view',
  ]),
  pharmacist: new Set([
    'dashboard.view',
    'patients.view',
    'prescriptions.view',
    'pharmacy.view', 'pharmacy.manage',
    'labOrders.view',
    'profile.view',
  ]),
  lab_tech: new Set([
    'dashboard.view',
    'patients.view',
    'labOrders.view', 'labOrders.update', 'labOrders.results',
    'profile.view',
  ]),
  accountant: new Set([
    'dashboard.view',
    'billing.view', 'billing.manage',
    'reports.view',
    'profile.view',
  ]),
  radiologist: new Set([
    'dashboard.view',
    'patients.view',
    'medicalReports.view', 'medicalReports.manage',
    'labOrders.view',
    'profile.view',
  ]),
  reception: new Set([
    'dashboard.view',
    'doctors.view', 'doctors.manage',
    'patients.view', 'patients.manage',
    'appointments.view', 'appointments.manage',
    'medicalReports.view',
    'aiInsights.view',
    'billing.view', 'billing.manage',
    'profile.view',
  ]),
  patient: new Set([
    'dashboard.view',
    'patients.view',
    'appointments.view',
    'medicalRecords.view',
    'medicalReports.view',
    'billing.view',
    'labOrders.view',
    'profile.view',
  ]),
};

export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  if (role === 'admin') return true;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
};

export const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrator',
    doctor: 'Doctor',
    nurse: 'Nurse',
    pharmacist: 'Pharmacist',
    lab_tech: 'Lab Technician',
    accountant: 'Accountant',
    radiologist: 'Radiologist',
    reception: 'Receptionist',
    patient: 'Patient',
  };
  return labels[role] || role;
};

export const getRoleColor = (role) => {
  const colors = {
    admin: 'text-violet-600 dark:text-violet-400',
    doctor: 'text-blue-600 dark:text-blue-400',
    nurse: 'text-pink-600 dark:text-pink-400',
    pharmacist: 'text-emerald-600 dark:text-emerald-400',
    lab_tech: 'text-amber-600 dark:text-amber-400',
    accountant: 'text-orange-600 dark:text-orange-400',
    radiologist: 'text-cyan-600 dark:text-cyan-400',
    reception: 'text-teal-600 dark:text-teal-400',
    patient: 'text-slate-600 dark:text-slate-400',
  };
  return colors[role] || 'text-slate-600 dark:text-slate-400';
};
