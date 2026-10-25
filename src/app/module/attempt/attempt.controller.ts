import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { AttemptAnswerService } from "./attempt.service";

const answerQuestion = catchAsync(async (req: Request, res: Response) => {
	const { questionID } = req.params;
	const user = req.user as IRequestUser;

	const result = await AttemptAnswerService.answerQuestion(
		questionID as string,
		user,
	);

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
