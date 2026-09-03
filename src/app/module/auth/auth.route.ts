import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { candidateRegistrationZodSchema } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	validateRequest(candidateRegistrationZodSchema),
	AuthController.registerCandidate,
);

router.post("/verify-email", AuthController.verifyEmail);

export const AuthRoutes = router;
