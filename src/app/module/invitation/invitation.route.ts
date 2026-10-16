import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { InvitationController } from "./invitation.controller";

const router = Router();

router.post(
	"/send",
	auth(UserRole.COMPANY),
	InvitationController.sendInvitation,
);

router.post(
	"/accept",
	auth(UserRole.CANDIDATE),
	InvitationController.acceptInvitation,
);

export const InvitationRoutes = router;
