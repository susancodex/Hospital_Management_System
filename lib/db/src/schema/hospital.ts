import { pgTable, text, serial, integer, timestamp, varchar, date, boolean, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 150 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull().default(""),
  lastName: varchar("last_name", { length: 100 }).notNull().default(""),
  role: varchar("role", { length: 50 }).notNull().default("patient"),
  phone: varchar("phone", { length: 30 }).default(""),
  profilePicture: text("profile_picture").default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  specialization: varchar("specialization", { length: 200 }).notNull().default(""),
  department: varchar("department", { length: 200 }).notNull().default(""),
  licenseNumber: varchar("license_number", { length: 100 }).default(""),
  experience: integer("experience").default(0),
  bio: text("bio").default(""),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }).default("0"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  dateOfBirth: date("date_of_birth"),
  bloodGroup: varchar("blood_group", { length: 10 }).default(""),
  address: text("address").default(""),
  emergencyContact: varchar("emergency_contact", { length: 100 }).default(""),
  allergies: text("allergies").default(""),
  chronicConditions: text("chronic_conditions").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => usersTable.id),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  date: date("date").notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  reason: text("reason").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const medicalRecordsTable = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => usersTable.id),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  appointmentId: integer("appointment_id").references(() => appointmentsTable.id),
  visitType: varchar("visit_type", { length: 50 }).default("consultation"),
  // Legacy flat fields (kept for backward compat)
  diagnosis: text("diagnosis").notNull().default(""),
  treatment: text("treatment").default(""),
  prescription: text("prescription").default(""),
  notes: text("notes").default(""),
  // SOAP note structure
  subjective: text("subjective").default(""),
  objective: text("objective").default(""),
  assessment: text("assessment").default(""),
  plan: text("plan").default(""),
  // Vital signs
  vitalSigns: jsonb("vital_signs").default({}),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const medicalReportsTable = pgTable("medical_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => usersTable.id),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  title: varchar("title", { length: 300 }).notNull(),
  reportType: varchar("report_type", { length: 100 }).default(""),
  fileUrl: text("file_url").default(""),
  description: text("description").default(""),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  findings: text("findings").default(""),
  recommendations: text("recommendations").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const billingTable = pgTable("billing", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => usersTable.id),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  appointmentId: integer("appointment_id").references(() => appointmentsTable.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  description: text("description").default(""),
  invoiceDate: date("invoice_date").defaultNow(),
  dueDate: date("due_date"),
  insuranceProvider: varchar("insurance_provider", { length: 200 }).default(""),
  claimNumber: varchar("claim_number", { length: 100 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const billingPaymentsTable = pgTable("billing_payments", {
  id: serial("id").primaryKey(),
  billingId: integer("billing_id").references(() => billingTable.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cash"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  transactionId: varchar("transaction_id", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => usersTable.id),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  appointmentId: integer("appointment_id").references(() => appointmentsTable.id),
  medicines: jsonb("medicines").notNull().default([]),
  instructions: text("instructions").default(""),
  status: varchar("status", { length: 30 }).notNull().default("active"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  relatedType: varchar("related_type", { length: 50 }),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }),
  resourceId: integer("resource_id"),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctorAvailabilityTable = pgTable("doctor_availability", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(),
  endTime: varchar("end_time", { length: 10 }).notNull(),
  slotDuration: integer("slot_duration").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
});

// ── LAB ORDERS ──────────────────────────────────────────────────────────────

export const labOrdersTable = pgTable("lab_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  patientId: integer("patient_id").references(() => usersTable.id),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  appointmentId: integer("appointment_id").references(() => appointmentsTable.id),
  tests: jsonb("tests").notNull().default([]),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  priority: varchar("priority", { length: 20 }).notNull().default("routine"),
  clinicalNotes: text("clinical_notes").default(""),
  collectedAt: timestamp("collected_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("lab_orders_patient_idx").on(t.patientId)]);

export const labResultsTable = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  labOrderId: integer("lab_order_id").references(() => labOrdersTable.id, { onDelete: "cascade" }),
  patientId: integer("patient_id").references(() => usersTable.id),
  testName: varchar("test_name", { length: 200 }).notNull(),
  testCode: varchar("test_code", { length: 50 }).default(""),
  resultValue: text("result_value").default(""),
  unit: varchar("unit", { length: 50 }).default(""),
  referenceRange: varchar("reference_range", { length: 100 }).default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  abnormalFlag: varchar("abnormal_flag", { length: 10 }).default(""),
  aiInterpretation: text("ai_interpretation").default(""),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
  reportedAt: timestamp("reported_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("lab_results_order_idx").on(t.labOrderId)]);

// ── PHARMACY ────────────────────────────────────────────────────────────────

export const pharmacyInventoryTable = pgTable("pharmacy_inventory", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  genericName: varchar("generic_name", { length: 300 }).default(""),
  category: varchar("category", { length: 100 }).default(""),
  dosageForm: varchar("dosage_form", { length: 50 }).default("tablet"),
  strength: varchar("strength", { length: 100 }).default(""),
  quantityInStock: integer("quantity_in_stock").notNull().default(0),
  unit: varchar("unit", { length: 30 }).default("tablets"),
  reorderLevel: integer("reorder_level").notNull().default(10),
  expiryDate: date("expiry_date"),
  manufacturer: varchar("manufacturer", { length: 200 }).default(""),
  batchNumber: varchar("batch_number", { length: 100 }).default(""),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0"),
  isControlled: boolean("is_controlled").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pharmacyDispensingTable = pgTable("pharmacy_dispensing", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").references(() => prescriptionsTable.id),
  patientId: integer("patient_id").references(() => usersTable.id),
  dispensedBy: integer("dispensed_by").references(() => usersTable.id),
  items: jsonb("items").notNull().default([]),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  notes: text("notes").default(""),
  dispensedAt: timestamp("dispensed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── SCHEMAS & TYPES ──────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMedicalRecordSchema = createInsertSchema(medicalRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMedicalReportSchema = createInsertSchema(medicalReportsTable).omit({ id: true, createdAt: true });
export const insertBillingSchema = createInsertSchema(billingTable).omit({ id: true, createdAt: true });
export const insertBillingPaymentSchema = createInsertSchema(billingPaymentsTable).omit({ id: true, createdAt: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true, createdAt: true });
export const insertLabOrderSchema = createInsertSchema(labOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLabResultSchema = createInsertSchema(labResultsTable).omit({ id: true, createdAt: true });
export const insertPharmacyInventorySchema = createInsertSchema(pharmacyInventoryTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPharmacyDispensingSchema = createInsertSchema(pharmacyDispensingTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type Doctor = typeof doctorsTable.$inferSelect;
export type Patient = typeof patientsTable.$inferSelect;
export type Appointment = typeof appointmentsTable.$inferSelect;
export type MedicalRecord = typeof medicalRecordsTable.$inferSelect;
export type MedicalReport = typeof medicalReportsTable.$inferSelect;
export type Billing = typeof billingTable.$inferSelect;
export type BillingPayment = typeof billingPaymentsTable.$inferSelect;
export type Prescription = typeof prescriptionsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;
export type DoctorAvailability = typeof doctorAvailabilityTable.$inferSelect;
export type LabOrder = typeof labOrdersTable.$inferSelect;
export type LabResult = typeof labResultsTable.$inferSelect;
export type PharmacyInventory = typeof pharmacyInventoryTable.$inferSelect;
export type PharmacyDispensing = typeof pharmacyDispensingTable.$inferSelect;
