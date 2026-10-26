import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { AttemptService } from "./attempt.service";

const answerQuestion = catchAsync(async (req: Request, res: Response) => {
	const { questionID, attemptID } = req.params;
	const user = req.user as IRequestUser;
	const answer = req.body

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

export const AttemptController = {
	answerQuestion,
};
