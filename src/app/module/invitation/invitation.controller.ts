import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { InvitationService } from "./invitation.service";

const sendInvitation = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;

	const data = await InvitationService.sendInvitation(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Invitation sent successfully!",
		data,
	});
});

const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;
	const { otp, invitationId } = payload;

	const data = await InvitationService.acceptInvitation(
		otp,
		invitationId,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Invitation accepted successfully!",
		data,
	});
});

export const InvitationController = {
	sendInvitation,
	acceptInvitation,
};
