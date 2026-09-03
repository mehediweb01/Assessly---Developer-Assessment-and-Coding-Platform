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
