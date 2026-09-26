import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../auth/auth.interface";
import type { IAddQuestion, IAssessmentCreate } from "./assessment.interface";

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

const addQuestion = async (payload: IAddQuestion, user: IRequestUser) => {
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

	if (!isUserExists.company) {
		throw new Error("Company not found");
	}

	if (payload.type !== "MCQ") {
		throw new Error("Invalid question type. Only MCQ type is allowed");
	}

	if (isUserExists.company.creditBalance < 2) {
		throw new Error("Company credit balance is less than 2");
	}

	const question = await prisma.question.create({
		data: {
			title: payload.title,
			type: payload.type,
			mark: payload.mark,
			options: payload.options,
			correctAnswer: payload.correctAnswer,
			assessment: {
				connect: {
					id: payload.assessmentId,
				},
			},
		},
	});

	await prisma.assessment.update({
		where: {
			id: payload.assessmentId,
		},
		data: {
			totalMarks: {
				increment: payload.mark,
			},
		},
	});

	await prisma.company.update({
		where: {
			id: isUserExists.company?.id,
		},
		data: {
			creditBalance: {
				decrement: 2,
			},
		},
	});

	return question;
};

export const AssessmentServices = {
	createdAssessment,
	addQuestion,
};
