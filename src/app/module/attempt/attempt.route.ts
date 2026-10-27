import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AttemptController } from "./attempt.controller";

const router = Router();

router.get(
	"/all-questions/:assessmentID",
	auth(UserRole.CANDIDATE),
	AttemptController.getAllQuestions,
);

router.post(
	"/answer/:attemptID/:questionID",
	auth(UserRole.CANDIDATE),
	AttemptController.answerQuestion,
);

export const AttemptRoutes = router;
