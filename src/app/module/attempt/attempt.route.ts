import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AttemptAnswerController } from "./attempt.controller";

const router = Router();

router.get(
	"/answer/:questionID",
	auth(UserRole.CANDIDATE),
	AttemptAnswerController.answerQuestion,
);

export const AttemptRoutes = router;
