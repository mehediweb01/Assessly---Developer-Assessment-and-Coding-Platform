import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import {
	candidateRegistrationZodSchema,
	companyRegistrationZodSchema,
	EmailVerificationZodSchema,
	forgotPasswordZodSchema,
	LoginZodSchema,
	resetPasswordZodSchema,
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

router.get(
	"/me",
	auth(UserRole.CANDIDATE, UserRole.COMPANY, UserRole.ADMIN),
	AuthController.getMe,
);

router.post(
	"/forgot-password",
	validateRequest(forgotPasswordZodSchema),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(resetPasswordZodSchema),
	AuthController.resetPassword,
);

router.post(
	"/company/register",
	auth(UserRole.ADMIN),
	validateRequest(companyRegistrationZodSchema),
	AuthController.registerCompany,
);

router.post("/google", AuthController.googleLogin);

export const AuthRoutes = router;
