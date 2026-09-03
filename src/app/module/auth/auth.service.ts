import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import path from "path";
import { UserRole } from "../../../generated/prisma/enums";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
	IForgotPassword,
	ILoginPayload,
	IRegisterCandidatePayload,
	IRequestUser,
	IResetPassword,
} from "./auth.interface";

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

const verifyEmail = async (userEmail: string, otp: string) => {
	const email = userEmail.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (isUserExist) {
		throw new AppError(httpStatus.CONFLICT, "User already exists!");
	}

	const opt_key = `register-candidate-user-otp:${email}`;
	const otpValue = await redisClient.get(opt_key);

	if (!otpValue) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP!");
	}

	if (otpValue !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Doesn't match OTP!");
	}

	await redisClient.del(opt_key);

	const user_data_key = `register-candidate-user-data:${email}`;
	const redisRegistrationPayload = await redisClient.get(user_data_key);

	const userData: IRegisterCandidatePayload = JSON.parse(
		redisRegistrationPayload as string,
	);

	if (userData.email !== email) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid email!");
	}

	const createdUser = await prisma.user.create({
		data: {
			name: userData.name,
			email: userData.email,
			password: userData.password,
			role: UserRole.CANDIDATE,
			candidate: {
				create: {
					name: userData.name,
					email: userData.email,
					phone: userData.candidate.phone,
					education: userData.candidate.education,
					experienceYear: userData.candidate.experienceYear,
					resumeUrl: userData.candidate.resumeUrl,
					skills: userData.candidate.skills,
					address: userData.candidate.address,
				},
			},
		},
		omit: {
			password: true,
		},
		include: {
			candidate: true,
		},
	});

	await redisClient.del(user_data_key);

	const ejsPath = path.join(
		process.cwd(),
		"src/app/templates/welcome-email.ejs",
	);

	const html = await ejs.renderFile(ejsPath, {
		name: createdUser.name,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Welcome to Assessly - Developer Assessment and Coding Platform",
		html,
	});

	const { candidate, ...user } = createdUser;
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		user,
		candidate,
		accessToken,
		refreshToken,
	};
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(
		token,
		config.jwt_refresh_secret,
	);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token!");
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: {
			id: data.userId,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	const jwtPayload = {
		userId: user?.id,
		name: user?.name,
		email: user?.email,
		role: user?.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const login = async (payload: ILoginPayload) => {
	const password = payload.password;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	if (!user.isActive) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is not active!");
	}

	if (user.isDeleted || user.deletedAt) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is deleted!");
	}

	const isMatchPassword = await bcrypt.compare(password, user.password);

	if (!isMatchPassword) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials!");
	}

	const jwPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
		user: {
			name: user.name,
			email: user.email,
			role: user.role,
		},
	};
};

const getMe = async (user: IRequestUser) => {
	const isUserExist = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			candidate: true,
			company: true,
		},
		omit: {
			password: true,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	return isUserExist;
};

const forgotPassword = async (payload: IForgotPassword) => {
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	if (!user.isActive) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is not active!");
	}

	if (user.isDeleted || user.deletedAt) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is deleted!");
	}

	const opt_key = `reset-password-otp:${email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(opt_key, otpValue, {
		expiration: {
			type: "EX",
			value: 5 * 60, // 5 minutes
		},
	});

	const ejsPath = path.join(
		process.cwd(),
		"src/app/templates/forgot-password-otp.ejs",
	);

	const html = await ejs.renderFile(ejsPath, {
		name: user.name,
		otp: otpValue,
		expirationMinutes: 5,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Reset Password OTP",
		html,
	});
};

const resetPassword = async (payload: IResetPassword) => {
	const email = payload.email.trim().toLowerCase();
	const { newPassword, otp } = payload;

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	if (!user.isActive) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is not active!");
	}

	if (user.isDeleted || user.deletedAt) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is deleted!");
	}

	const opt_key = `reset-password-otp:${email}`;
	const otpValue = await redisClient.get(opt_key);

	if (!otpValue) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP!");
	}

	if (otpValue !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Doesn't match OTP!");
	}

	const hashedPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	const updatedUser = await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			password: hashedPassword,
		},
		select: {
			name: true,
			email: true,
			role: true,
		},
	});

	await redisClient.del(opt_key);

	const ejsPath = path.join(
		process.cwd(),
		"src/app/templates/reset-password-success.ejs",
	);

	const html = await ejs.renderFile(ejsPath, {
		name: user.name,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: user.email,
		subject: "Password changed",
		html,
	});

	return updatedUser;
};

export const AuthServices = {
	registerCandidate,
	verifyEmail,
	refreshToken,
	login,
	getMe,
	forgotPassword,
	resetPassword,
};
