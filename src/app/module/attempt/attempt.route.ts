import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AttemptController } from "./attempt.controller";

const router = Router();

router.get(
	"/answer/:attemptID/:questionID",
	auth(UserRole.CANDIDATE),
	AttemptController.answerQuestion,
);

export const AttemptRoutes = router;
