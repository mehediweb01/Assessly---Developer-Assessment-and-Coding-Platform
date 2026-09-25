import { randomUUID } from "crypto";
import { PaymentStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { getGrandIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../auth/auth.interface";

const initiatePayment = async (user: IRequestUser) => {
	const transactionResult = await prisma.$transaction(async (tx) => {
		const isExistingUser = await tx.user.findUnique({
			where: {
				id: user.userId,
			},
			include: {
				company: true,
			},
		});

		if (!isExistingUser) {
			throw new Error("User not found");
		}

		if (!isExistingUser.isActive) {
			throw new Error("User is not active");
		}

		if (isExistingUser.isDeleted || isExistingUser.deletedAt) {
			throw new Error("User is deleted");
		}

		const bkashIdToken = await getGrandIdToken();

		if (!bkashIdToken) {
			throw new Error("Bkash token not found");
		}

		const createPaymentResponse = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/create`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: bkashIdToken,
					"X-App-Key": config.bkash_app_key,
				},
				body: JSON.stringify({
					mode: "0011",
					payerReference: user.email,
					callbackURL: `${config.bkash_callback_url}/assessment/payment/callback`,
					amount: "120",
					currency: "BDT",
					intent: "sale",
					merchantInvoiceNumber: `INV-${randomUUID()}`,
				}),
			},
		);

		if (!createPaymentResponse.ok) {
			throw new Error("Failed to initiate payment");
		}

		const result = await createPaymentResponse.json();

		await tx.payment.create({
			data: {
				bkashPaymentId: result.paymentID,
				amount: Number(result.amount),
				merchantInvoiceNumber: result.merchantInvoiceNumber,
				status: PaymentStatus.PENDING,
				credits: 30,
				company: {
					connect: {
						id: isExistingUser.company?.id,
					},
				},
			},
		});

		return result;
	});

	return transactionResult;
};

export const PaymentServices = {
	initiatePayment,
};
