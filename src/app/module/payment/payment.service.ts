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
          callbackURL: `${config.bkash_callback_url}/payment/company/callback`,
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

    return {
      paymentID: result.paymentID,
      bkashURL: result.bkashURL,
    };
  });

  return transactionResult;
};

const paymentExecute = async (query: Record<string, any>) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const paymentID = query.paymentID;

    if (!paymentID) {
      throw new Error("Payment ID not found");
    }

    if (!query.status) {
      throw new Error("Payment status not found");
    }

    const bkashIdToken = await getGrandIdToken();

    if (!bkashIdToken) {
      throw new Error("Bkash token not found");
    }

    const executedPaymentResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID: paymentID,
        }),
      },
    );

    if (!executedPaymentResponse.ok) {
      throw new Error("Failed to execute payment");
    }

    const result = await executedPaymentResponse.json();

    if (query.status === "success") {
      const payment = await tx.payment.findUnique({
        where: {
          bkashPaymentId: paymentID,
        },
        include: {
          company: true,
        },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.status === PaymentStatus.PAID || payment.paidAt) {
        throw new Error("Payment already paid");
      }

      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          bkashTrxId: result.trxID,
          paidAt: result.paymentExecuteTime,
          gatewayResponse: result,
          status: PaymentStatus.PAID,
        },
      });

      await tx.company.update({
        where: {
          id: payment?.company.id,
        },
        data: {
          creditBalance: {
            increment: payment?.credits,
          },
        },
      });
    }

    return result;
  });

  return transactionResult;
};

export const PaymentServices = {
  initiatePayment,
  paymentExecute,
};
