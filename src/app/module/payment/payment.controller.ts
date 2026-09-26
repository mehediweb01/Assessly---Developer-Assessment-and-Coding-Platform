import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { PaymentServices } from "./payment.service";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as IRequestUser;

	const result = await PaymentServices.initiatePayment(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payment initiated successfully",
		data: result,
	});
});

const paymentExecute = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await PaymentServices.paymentExecute(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment executed successfully",
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  paymentExecute,
};
