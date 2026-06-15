import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import doctorsRouter from "./doctors";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import medicalRouter from "./medical";
import billingRouter from "./billing";
import aiRouter from "./ai";
import prescriptionsRouter from "./prescriptions";
import notificationsRouter from "./notifications";
import auditRouter from "./audit";
import usersRouter from "./users";
import availabilityRouter from "./availability";
import statsRouter from "./stats";
import labRouter from "./lab";
import pharmacyRouter from "./pharmacy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(doctorsRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(medicalRouter);
router.use(billingRouter);
router.use(aiRouter);
router.use(prescriptionsRouter);
router.use(notificationsRouter);
router.use(auditRouter);
router.use(usersRouter);
router.use(availabilityRouter);
router.use(statsRouter);
router.use(labRouter);
router.use(pharmacyRouter);

export default router;
