import crypto from "crypto";
import ejs from "ejs";
import path from "path";
import { InvitationStatus, UserRole } from "../../../generated/prisma/enums";
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
	const isUserExits = await prisma.candidate.findUnique({
		where: {
			email: payload.email,
		},
		include: {
			user: true,
		},
	});

	if (!isUserExits) {
		throw new Error("User does not exist");
	}

	if (isUserExits.user.role !== UserRole.CANDIDATE) {
		throw new Error("User is not a candidate");
	}

	if (isUserExits.user.deletedAt || isUserExits.user.isDeleted) {
		throw new Error("User is deleted");
	}

	if (!isUserExits.user.isActive) {
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

	const isOwnerOfAssessment = await prisma.assessment.findUnique({
		where: {
			id: payload.assessmentId,
		},
	});

	if (!isOwnerOfAssessment) {
		throw new Error("Assessment does not exist");
	}

	if (isOwnerOfAssessment.deletedAt || isOwnerOfAssessment.isDeleted) {
		throw new Error("Assessment is deleted");
	}

	if (isOwnerOfAssessment.companyId !== isCompanyExists.id) {
		throw new Error(
			"You are not authorized to send invitation for this assessment",
		);
	}

	const opt_key = `invitation-otp-key:${payload.email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(opt_key, otpValue, {
		expiration: {
			type: "EX",
			value: 24 * 60 * 60, // 24 hour
		},
	});

	await prisma.invitation.create({
		data: {
			candidate: {
				connect: {
					id: isUserExits.id,
				},
			},
			company: {
				connect: {
					id: isCompanyExists.id,
				},
			},
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
			sendAt: new Date(),
			assessment: {
				connect: {
					id: payload.assessmentId,
				},
			},
			status: InvitationStatus.PENDING,
		},
	});

	const ejsPath = path.join(process.cwd(), "src/app/templates/invitation.ejs");

	const html = await ejs.renderFile(ejsPath, {
		name: isUserExits.name,
		companyName: isCompanyExists.companyName,
		assessmentTitle: isOwnerOfAssessment.title,
		invitationCode: otpValue,
		expirationHour: 24,
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
