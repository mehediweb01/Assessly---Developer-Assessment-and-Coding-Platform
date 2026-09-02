import httpStatus from "http-status";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
export const validateRequest = (zodSchema) => {
    return catchAsync((req, _res, next) => {
        const payload = req.body ?? {};
        const validationPayload = zodSchema.safeParse(payload);
        if (!validationPayload.success) {
            throw new AppError(httpStatus.BAD_REQUEST, validationPayload.error.issues[0].message || "Validation Error");
        }
        req.body = validationPayload.data;
        next();
    });
};
