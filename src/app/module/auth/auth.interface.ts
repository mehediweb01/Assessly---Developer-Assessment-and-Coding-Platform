import type { UserRole } from "../../../generated/prisma/enums";

export interface IRegisterUser {
	name: string;
	email: string;
	password: string;
	role: UserRole;
	googleId?: string;
}

export interface IRegisterCandidatePayload extends IRegisterUser {
	candidate: {
		phone: string;
		bio?: string;
		skills: string[];
		education: string;
		experienceYear?: number;
		resumeUrl: string;
		address?: string;
	};
}

export interface ILoginPayload {
	email: string;
	password: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: UserRole;
}

export interface IForgotPassword {
	email: string;
}

export interface IResetPassword {
	email: string;
	newPassword: string;
	otp: string;
}
