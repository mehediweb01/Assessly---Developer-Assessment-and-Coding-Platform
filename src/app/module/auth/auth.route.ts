import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import {
	candidateRegistrationZodSchema,
	EmailVerificationZodSchema,
	LoginZodSchema,
} from "./auth.validation";

const router = Router();

router.post(
	"/register",
	validateRequest(candidateRegistrationZodSchema),
	AuthController.registerCandidate,
);

router.post(
	"/verify-email",
	validateRequest(EmailVerificationZodSchema),
	AuthController.verifyEmail,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/login", validateRequest(LoginZodSchema), AuthController.login);

export const AuthRoutes = router;
