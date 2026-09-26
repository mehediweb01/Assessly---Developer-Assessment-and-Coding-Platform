import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AssessmentController } from "./assessment.controller";

const router = Router();

router.post(
	"/create",
	auth(UserRole.COMPANY),
	AssessmentController.createAssessment,
);

export const AssessmentRoutes = router;
