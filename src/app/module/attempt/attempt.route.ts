import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AttemptController } from "./attempt.controller";

const router = Router();

router.get(
	"/all-questions/:assessmentID",
	auth(UserRole.CANDIDATE, UserRole.COMPANY, UserRole.ADMIN),
	AttemptController.getAllQuestions,
);

router.get(
	"/single-questions/:questionID",
	auth(UserRole.CANDIDATE, UserRole.COMPANY, UserRole.ADMIN),
	AttemptController.getSingleQuestion,
);

router.post(
	"/answer/:attemptID/:questionID",
	auth(UserRole.CANDIDATE),
	AttemptController.answerQuestion,
);

router.post(
	"/submit/:attemptID",
	auth(UserRole.CANDIDATE),
	AttemptController.submitAttempt,
);

export const AttemptRoutes = router;
