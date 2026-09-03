import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import { UserRole } from "../../../generated/prisma/enums";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import type { IRegisterCandidatePayload } from "./auth.interface";

const registerCandidate = async (payload: IRegisterCandidatePayload) => {
	const { name, password, candidate } = payload;
	const email = payload.email.trim().toLowerCase();
	const { skills, education, experienceYear, resumeUrl, phone, bio, address } =
		candidate;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email: email,
		},
	});

	if (isUserExist) {
		throw new AppError(httpStatus.CONFLICT, "User already exists!");
	}

	const isCandidateExist = await prisma.candidate.findUnique({
		where: {
			phone: phone,
		},
	});

	if (isCandidateExist) {
		throw new AppError(httpStatus.CONFLICT, "Candidate already exists!");
	}

	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds),
	);

	const opt_key = `register-candidate-user-otp:${email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(opt_key, otpValue, {
		expiration: {
			type: "EX",
			value: 5 * 60, // 5 minutes
		},
	});

	const user_data_key = `register-candidate-user-data:${email}`;
	const redisRegistrationPayload = {
		name,
		email,
		password: hashedPassword,
		role: UserRole.CANDIDATE,
		candidate: {
			name,
			email,
			phone,
			education,
			experienceYear: experienceYear || 0,
			resumeUrl,
			skills,
			bio: bio || "",
			address: address || "",
		},
	};

	redisClient.set(user_data_key, JSON.stringify(redisRegistrationPayload), {
		expiration: {
			type: "EX",
			value: 5 * 60, // 5 minutes
		},
	});

	const ejsPath = path.join(
		process.cwd(),
		"src/app/templates/email-verification.ejs",
	);

	const html = await ejs.renderFile(ejsPath, {
		name: name,
		email,
		otp: otpValue,
		expirationMinutes: 5,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Email verification",
		html,
	});
};

export const AuthServices = {
	registerCandidate,
};
