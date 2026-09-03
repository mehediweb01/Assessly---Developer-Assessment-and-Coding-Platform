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

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const { email, otp } = req.body;

	const result = await AuthServices.verifyEmail(email, otp);

	const { accessToken, refreshToken, user, candidate } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24,
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "User verified successfully!",
		data: {
			accessToken,
			refreshToken,
			candidate,
			user,
		},
	});
});

export const AuthController = {
	registerCandidate,
	verifyEmail,
};
