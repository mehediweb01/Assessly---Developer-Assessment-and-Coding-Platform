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

	const invitation = await prisma.invitation.create({
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

	const opt_key = `invitation-otp-key:${payload.email}:${invitation.id}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(opt_key, otpValue, {
		expiration: {
			type: "EX",
			value: 24 * 60 * 60, // 24 hour
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

const acceptInvitation = async (
	otp: string,
	invitationId: string,
	user: IRequestUser,
) => {
	if (!otp) {
		throw new Error("OTP is required");
	}

	const isExistingCandidate = await prisma.candidate.findUnique({
		where: {
			email: user.email,
		},
		include: {
			user: true,
			invitations: true,
		},
	});

	if (!isExistingCandidate) {
		throw new Error("User does not exist");
	}

	if (isExistingCandidate.userId !== user.userId) {
		throw new Error("You are not authorized to accept this invitation");
	}

	if (!isExistingCandidate.user.isActive) {
		throw new Error("User is not active");
	}

	if (
		isExistingCandidate.user.isDeleted ||
		isExistingCandidate.user.deletedAt
	) {
		throw new Error("User is deleted");
	}

	const invitation = await prisma.invitation.findFirst({
		where: {
			id: invitationId,
			candidateId: isExistingCandidate.id,
		},
	});

	if (!invitation) {
		throw new Error("Invitation does not exist");
	}

	if (invitation.status === InvitationStatus.ACCEPT) {
		throw new Error("Invitation is already accepted!");
	}

	if (invitation.status === InvitationStatus.EXPIRED) {
		throw new Error("Invitation is expired!");
	}

	const otp_key = `invitation-otp-key:${user.email}:${invitation.id}`;
	const otpValue = await redisClient.get(otp_key);

	if (!otpValue) {
		await prisma.invitation.updateMany({
			where: {
				id: invitation.id,
				candidateId: isExistingCandidate.id,
				status: InvitationStatus.PENDING,
			},
			data: {
				status: InvitationStatus.EXPIRED,
			},
		});
		throw new Error("OTP is expired or invalid!");
	}

	if (otp !== otpValue) {
		throw new Error("Invalid OTP!");
	}

	const result = await prisma.invitation.updateMany({
		where: {
			id: invitation.id,
			candidateId: isExistingCandidate.id,
			status: InvitationStatus.PENDING,
			expiresAt: {
				gt: new Date(),
			},
		},
		data: {
			status: InvitationStatus.ACCEPT,
		},
	});

	if (result.count === 0) {
		throw new Error("Invitation is no longer valid!");
	}

	await redisClient.del(otp_key);
};

export const InvitationService = {
	sendInvitation,
	acceptInvitation,
};
