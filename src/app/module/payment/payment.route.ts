import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post(
	"/initiate",
	auth(UserRole.COMPANY),
	PaymentController.initiatePayment,
);

router.get("/company/callback", PaymentController.paymentExecute);

export const PaymentRoutes = router;
