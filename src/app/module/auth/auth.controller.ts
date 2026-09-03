import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";

const registerCandidate = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthServices.registerCandidate(payload);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "OTP sent successfully on your email!",
		data: result,
	});
});

export const AuthController = {
	registerCandidate,
};
