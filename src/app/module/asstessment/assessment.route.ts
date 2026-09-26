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

router.post(
	"/add-question",
	auth(UserRole.COMPANY),
	AssessmentController.addQuestion,
);

router.patch(
	"/publish",
	auth(UserRole.COMPANY),
	AssessmentController.assessmentPublish,
);

export const AssessmentRoutes = router;
