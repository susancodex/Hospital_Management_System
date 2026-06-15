import { Router } from "express";
import { db, usersTable, patientsTable, doctorsTable, appointmentsTable, billingTable, medicalRecordsTable, auditLogsTable } from "@workspace/db";
import { count, eq, and, gte, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /stats/ — role-aware dashboard statistics
router.get("/stats/", requireAuth, async (req, res) => {
  const user = req.user!;
  const today = new Date().toISOString().split("T")[0];

  if (user.role === "admin") {
    const [totalPatients] = await db.select({ count: count() }).from(patientsTable);
    const [totalDoctors] = await db.select({ count: count() }).from(doctorsTable);
    const [totalAppointments] = await db.select({ count: count() }).from(appointmentsTable);
    const [todayAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.date, today));
    const [pendingAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.status, "pending"));
    const [completedAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.status, "completed"));
    const [activeUsers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isActive, true));

    const billingRows = await db.select().from(billingTable);
    const totalRevenue = billingRows
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const outstandingRevenue = billingRows
      .filter((b) => b.status !== "paid")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const recentLogs = await db
      .select()
      .from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(5);

    const appointmentsByStatus = {
      pending: Number(pendingAppointments.count),
      completed: Number(completedAppointments.count),
    };

    res.json({
      role: "admin",
      total_patients: Number(totalPatients.count),
      total_doctors: Number(totalDoctors.count),
      total_appointments: Number(totalAppointments.count),
      today_appointments: Number(todayAppointments.count),
      pending_appointments: Number(pendingAppointments.count),
      active_users: Number(activeUsers.count),
      total_revenue: totalRevenue,
      outstanding_revenue: outstandingRevenue,
      appointments_by_status: appointmentsByStatus,
      recent_activity: recentLogs.map((l) => ({
        action: l.action,
        resource: l.resource,
        timestamp: l.createdAt,
      })),
    });
    return;
  }

  if (user.role === "doctor") {
    const [myAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.doctorId, user.id));
    const [todayAppts] = await db.select({ count: count() }).from(appointmentsTable).where(and(eq(appointmentsTable.doctorId, user.id), eq(appointmentsTable.date, today)));
    const [pendingAppts] = await db.select({ count: count() }).from(appointmentsTable).where(and(eq(appointmentsTable.doctorId, user.id), eq(appointmentsTable.status, "pending")));
    const [completedAppts] = await db.select({ count: count() }).from(appointmentsTable).where(and(eq(appointmentsTable.doctorId, user.id), eq(appointmentsTable.status, "completed")));

    const uniquePatients = await db
      .selectDistinct({ patientId: appointmentsTable.patientId })
      .from(appointmentsTable)
      .where(eq(appointmentsTable.doctorId, user.id));

    const [myRecords] = await db.select({ count: count() }).from(medicalRecordsTable).where(eq(medicalRecordsTable.doctorId, user.id));

    const upcomingAppts = await db
      .select({ appt: appointmentsTable, patient: usersTable })
      .from(appointmentsTable)
      .leftJoin(usersTable, eq(appointmentsTable.patientId, usersTable.id))
      .where(and(eq(appointmentsTable.doctorId, user.id), gte(appointmentsTable.date, today)))
      .orderBy(appointmentsTable.date, appointmentsTable.time)
      .limit(5);

    res.json({
      role: "doctor",
      total_appointments: Number(myAppointments.count),
      today_appointments: Number(todayAppts.count),
      pending_appointments: Number(pendingAppts.count),
      completed_appointments: Number(completedAppts.count),
      total_patients: uniquePatients.length,
      medical_records_created: Number(myRecords.count),
      upcoming_appointments: upcomingAppts.map((r) => ({
        id: r.appt.id,
        date: r.appt.date,
        time: r.appt.time,
        status: r.appt.status,
        reason: r.appt.reason,
        patient_name: r.patient ? `${r.patient.firstName} ${r.patient.lastName}`.trim() : "Unknown",
        patient_id: r.appt.patientId,
      })),
    });
    return;
  }

  if (user.role === "patient") {
    const [myAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.patientId, user.id));
    const [upcomingCount] = await db.select({ count: count() }).from(appointmentsTable).where(and(eq(appointmentsTable.patientId, user.id), gte(appointmentsTable.date, today)));
    const [myRecords] = await db.select({ count: count() }).from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, user.id));

    const upcoming = await db
      .select({ appt: appointmentsTable, doctor: usersTable })
      .from(appointmentsTable)
      .leftJoin(usersTable, eq(appointmentsTable.doctorId, usersTable.id))
      .where(and(eq(appointmentsTable.patientId, user.id), gte(appointmentsTable.date, today)))
      .orderBy(appointmentsTable.date, appointmentsTable.time)
      .limit(3);

    const billingRows = await db
      .select()
      .from(billingTable)
      .where(eq(billingTable.patientId, user.id));

    const totalBilled = billingRows.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const outstandingBilled = billingRows
      .filter((b) => b.status !== "paid")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    res.json({
      role: "patient",
      total_appointments: Number(myAppointments.count),
      upcoming_appointments_count: Number(upcomingCount.count),
      medical_records: Number(myRecords.count),
      total_billed: totalBilled,
      outstanding_balance: outstandingBilled,
      upcoming_appointments: upcoming.map((r) => ({
        id: r.appt.id,
        date: r.appt.date,
        time: r.appt.time,
        status: r.appt.status,
        reason: r.appt.reason,
        doctor_name: r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}`.trim() : "Unknown",
        doctor_id: r.appt.doctorId,
      })),
    });
    return;
  }

  // Fallback for reception and other roles
  const [totalPatients] = await db.select({ count: count() }).from(patientsTable);
  const [todayAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.date, today));
  res.json({
    role: user.role,
    total_patients: Number(totalPatients.count),
    today_appointments: Number(todayAppointments.count),
  });
});

export default router;
