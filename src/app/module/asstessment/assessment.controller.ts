import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { AssessmentServices } from "./assessment.service";

const createAssessment = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;

	const result = await AssessmentServices.createdAssessment(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Assessment created successfully",
		data: result,
	});
});

const addQuestion = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;

	const result = await AssessmentServices.addQuestion(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Question created successfully",
		data: result,
	});
});

export const AssessmentController = {
	createAssessment,
	addQuestion,
};
