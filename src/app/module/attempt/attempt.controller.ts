import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AttemptAnswerService } from "./attempt.service";

const answerQuestion = catchAsync(async (req: Request, res: Response) => {
	const result = await AttemptAnswerService.answerQuestion();

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Answer the question successfully!",
		data: result,
	});
});

export const AttemptAnswerController = {
	answerQuestion,
};
