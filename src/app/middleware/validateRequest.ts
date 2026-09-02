import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { ZodObject } from "zod";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: ZodObject) => {
	return catchAsync((req: Request, _res: Response, next: NextFunction) => {
		const payload = req.body ?? {};

		const validationPayload = zodSchema.safeParse(payload);

		if (!validationPayload.success) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				validationPayload.error.issues[0].message || "Validation Error",
			);
		}

		req.body = validationPayload.data;

		next();
	});
};
