import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../auth/auth.interface";
import type { IAssessmentCreate } from "./assessment.interface";

const createdAssessment = async (
	payload: IAssessmentCreate,
	user: IRequestUser,
) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			company: true,
		},
	});

	if (!isUserExists) {
		throw new Error("Company not found");
	}

	if (!isUserExists.isActive) {
		throw new Error("Company is not active");
	}

	if (isUserExists.isDeleted || isUserExists.deletedAt) {
		throw new Error("Company is deleted");
	}

	const assessment = await prisma.assessment.create({
		data: {
			title: payload.title,
			startDateTime: payload.startDateTime,
			endDateTime: payload.endDateTime,
			company: {
				connect: {
					id: isUserExists.company?.id,
				},
			},
		},
	});

	return assessment;
};

export const AssessmentServices = {
	createdAssessment,
};
