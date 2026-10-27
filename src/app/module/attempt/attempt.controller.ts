import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { AttemptService } from "./attempt.service";

const getAllQuestions = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const { assessmentID } = req.params;

	const result = await AttemptService.getAllQuestions(
		assessmentID as string,
		user,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Get all questions successfully!",
		data: result,
	});
});

const getSingleQuestion = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;
	const { questionID } = req.params;

	const result = await AttemptService.getSingleQuestion(
		questionID as string,
		user,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Get single question successfully!",
		data: result,
	});
});

const answerQuestion = catchAsync(async (req: Request, res: Response) => {
	const { questionID, attemptID } = req.params;
	const user = req.user as IRequestUser;
	const { answer } = req.body;

	const result = await AttemptService.answerQuestion(
		questionID as string,
		attemptID as string,
		answer,
		user,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Answer the question successfully!",
		data: result,
	});
});

const submitAttempt = catchAsync(async (req: Request, res: Response) => {
	const { attemptID } = req.params;
	const user = req.user as IRequestUser;

	const result = await AttemptService.submitAttempt(attemptID as string, user);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Submit the attempt successfully!",
		data: result,
	});
});

export const AttemptController = {
	getAllQuestions,
	getSingleQuestion,
	answerQuestion,
	submitAttempt,
};
