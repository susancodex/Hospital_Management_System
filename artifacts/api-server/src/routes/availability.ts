import { Router } from "express";
import { db, doctorAvailabilityTable, usersTable, appointmentsTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { logAction } from "../lib/audit";

const router = Router();

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current + slotDuration <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += slotDuration;
  }
  return slots;
}

// GET /availability/ — get doctor's own availability (doctor) or any doctor's (admin)
router.get("/availability/", requireAuth, async (req, res) => {
  const user = req.user!;
  const doctorId = req.query.doctor_id ? Number(req.query.doctor_id) : null;

  let targetDoctorUserId: number;

  if (user.role === "doctor") {
    targetDoctorUserId = user.id;
  } else if (doctorId) {
    targetDoctorUserId = doctorId;
  } else {
    res.status(400).json({ detail: "doctor_id is required for admin queries." });
    return;
  }

  const slots = await db
    .select()
    .from(doctorAvailabilityTable)
    .where(eq(doctorAvailabilityTable.doctorId, targetDoctorUserId));

  res.json({
    results: slots.map((s) => ({
      id: s.id,
      doctor_id: s.doctorId,
      day_of_week: s.dayOfWeek,
      day_name: DAY_NAMES[s.dayOfWeek],
      start_time: s.startTime,
      end_time: s.endTime,
      slot_duration: s.slotDuration,
      is_active: s.isActive,
    })),
  });
});

// POST /availability/ — doctor sets availability for a day
router.post("/availability/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const user = req.user!;
  const { day_of_week, start_time, end_time, slot_duration = 30, doctor_id } = req.body;

  if (day_of_week === undefined || !start_time || !end_time) {
    res.status(400).json({ detail: "day_of_week, start_time, and end_time are required." });
    return;
  }

  const targetDoctorId = user.role === "admin" && doctor_id ? Number(doctor_id) : user.id;

  // Remove existing entry for this day if any
  await db
    .delete(doctorAvailabilityTable)
    .where(
      and(
        eq(doctorAvailabilityTable.doctorId, targetDoctorId),
        eq(doctorAvailabilityTable.dayOfWeek, Number(day_of_week))
      )
    );

  const [slot] = await db.insert(doctorAvailabilityTable).values({
    doctorId: targetDoctorId,
    dayOfWeek: Number(day_of_week),
    startTime: start_time,
    endTime: end_time,
    slotDuration: Number(slot_duration),
    isActive: true,
  }).returning();

  await logAction(req, "CREATE", "availability", slot.id);
  res.status(201).json({
    id: slot.id,
    doctor_id: slot.doctorId,
    day_of_week: slot.dayOfWeek,
    day_name: DAY_NAMES[slot.dayOfWeek],
    start_time: slot.startTime,
    end_time: slot.endTime,
    slot_duration: slot.slotDuration,
    is_active: slot.isActive,
  });
});

// DELETE /availability/:id/ — doctor removes a slot
router.delete("/availability/:id/", requireAuth, requireRole("doctor", "admin"), async (req, res) => {
  const user = req.user!;
  const [slot] = await db
    .select()
    .from(doctorAvailabilityTable)
    .where(eq(doctorAvailabilityTable.id, Number(req.params.id)));

  if (!slot) { res.status(404).json({ detail: "Not found." }); return; }

  if (user.role === "doctor" && slot.doctorId !== user.id) {
    res.status(403).json({ detail: "You can only delete your own availability." });
    return;
  }

  await db.delete(doctorAvailabilityTable).where(eq(doctorAvailabilityTable.id, slot.id));
  await logAction(req, "DELETE", "availability", slot.id);
  res.status(204).send();
});

// GET /availability/slots/ — get available time slots for a doctor on a specific date
router.get("/availability/slots/", requireAuth, async (req, res) => {
  const { doctor_id, date } = req.query as Record<string, string>;

  if (!doctor_id || !date) {
    res.status(400).json({ detail: "doctor_id and date are required." });
    return;
  }

  const d = new Date(date);
  const dayOfWeek = d.getDay();

  const [availability] = await db
    .select()
    .from(doctorAvailabilityTable)
    .where(
      and(
        eq(doctorAvailabilityTable.doctorId, Number(doctor_id)),
        eq(doctorAvailabilityTable.dayOfWeek, dayOfWeek),
        eq(doctorAvailabilityTable.isActive, true)
      )
    );

  if (!availability) {
    res.json({ slots: [], message: "Doctor is not available on this day." });
    return;
  }

  const allSlots = generateTimeSlots(availability.startTime, availability.endTime, availability.slotDuration);

  // Find booked slots for this doctor on this date
  const booked = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, Number(doctor_id)),
        eq(appointmentsTable.date, date)
      )
    );

  const bookedTimes = new Set(
    booked
      .filter((a) => a.status !== "cancelled" && a.status !== "rejected")
      .map((a) => a.time)
  );

  const slots = allSlots.map((time) => ({
    time,
    available: !bookedTimes.has(time),
  }));

  res.json({ slots, day: DAY_NAMES[dayOfWeek] });
});

export default router;
