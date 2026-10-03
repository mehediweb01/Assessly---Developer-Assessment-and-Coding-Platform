import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { InvitationService } from "./invitation.service";

const sendInvitation = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;

	await InvitationService.sendInvitation(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Invitation sent successfully!",
		data: null,
	});
});

export const InvitationController = {
	sendInvitation,
};
