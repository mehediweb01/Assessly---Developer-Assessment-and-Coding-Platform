import crypto from "crypto";
import ejs from "ejs";
import path from "path";
import { UserRole } from "../../../generated/prisma/enums";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import type { IRequestUser } from "../auth/auth.interface";
import type { ISendInvitationPayload } from "./invitation.interface";

const sendInvitation = async (
	payload: ISendInvitationPayload,
	user: IRequestUser,
) => {
	const isUserExits = await prisma.user.findUnique({
		where: {
			email: payload.email,
		},
	});

	if (!isUserExits) {
		throw new Error("User does not exist");
	}

	if (isUserExits.role !== UserRole.CANDIDATE) {
		throw new Error("User is not a candidate");
	}

	if (isUserExits.deletedAt || isUserExits.isDeleted) {
		throw new Error("User is deleted");
	}

	if (!isUserExits.isActive) {
		throw new Error("User is not active");
	}

	const isCompanyExists = await prisma.company.findUnique({
		where: {
			userId: user.userId,
		},
		include: {
			user: true,
		},
	});

	if (!isCompanyExists) {
		throw new Error("Company does not exist");
	}

	if (isCompanyExists.userId !== user.userId) {
		throw new Error(
			"You are not authorized to send invitation for this company",
		);
	}

	if (isCompanyExists.user.role !== UserRole.COMPANY) {
		throw new Error(
			"You are not authorized to send invitation for this company",
		);
	}

	if (isCompanyExists.user.deletedAt || isCompanyExists.user.isDeleted) {
		throw new Error("Company is deleted");
	}

	if (!isCompanyExists.user.isActive) {
		throw new Error("Company is not active");
	}

	const opt_key = `invitation-otp-key:${payload.email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(opt_key, otpValue, {
		expiration: {
			type: "EX",
			value: 5 * 60, // 5 minutes
		},
	});

	const ejsPath = path.join(process.cwd(), "src/app/templates/invitation.ejs");

	const html = await ejs.renderFile(ejsPath, {
		name: isUserExits.name,
		companyName: isCompanyExists.companyName,
		invitationCode: otpValue,
		expirationMinutes: 5,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: payload.email,
		subject: "Invitation to join Assessly",
		html,
	});
};

export const InvitationService = {
	sendInvitation,
};
