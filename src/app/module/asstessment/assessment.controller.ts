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

const assessmentPublish = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;

	const result = await AssessmentServices.assessmentPublish(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: " Assessment published successfully",
		data: result,
	});
});

const deleteQuestion = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;

	await AssessmentServices.deleteQuestion(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Question deleted successfully",
		data: null,
	});
});

const editQuestion = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as IRequestUser;
	const questionId = req.params.questionId as string;

	const result = await AssessmentServices.editQuestion(
		payload,
		questionId,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Question edited successfully",
		data: result,
	});
});

export const AssessmentController = {
	createAssessment,
	addQuestion,
	assessmentPublish,
	deleteQuestion,
	editQuestion,
};
