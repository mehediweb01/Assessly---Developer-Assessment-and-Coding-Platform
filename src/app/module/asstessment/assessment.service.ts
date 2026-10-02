import { AssessmentStatus } from "../../../generated/prisma/enums";
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

	if (!payload.assessmentId) {
		throw new Error("Assessment ID not found");
	}

	const assessment = await prisma.assessment.findUnique({
		where: {
			id: payload.assessmentId,
		},
	});

	if (!assessment) {
		throw new Error("Assessment not found");
	}

	if (isUserExists.company.id !== assessment.companyId) {
		throw new Error("You are not the owner of this assessment");
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

const assessmentPublish = async (
	payload: {
		assessmentId: string;
	},
	user: IRequestUser,
) => {
	const { assessmentId } = payload;

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

	const assessment = await prisma.assessment.findUnique({
		where: {
			id: assessmentId,
		},
		include: {
			questions: true,
			company: true,
			_count: {
				select: {
					questions: true,
				},
			},
		},
	});

	if (!assessment) {
		throw new Error("Assessment not found");
	}

	if (assessment._count.questions < 1) {
		throw new Error("Assessment must have at least 1 question");
	}

	if (assessment.company.id !== isUserExists.company.id) {
		throw new Error("You are not authorized to publish this assessment");
	}

	const assessmentPublished = await prisma.assessment.update({
		where: {
			id: assessment.id,
		},
		data: {
			status: AssessmentStatus.PUBLISHED,
		},
	});

	return assessmentPublished;
};

const deleteQuestion = async (
	payload: {
		questionId: string;
	},
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

	if (!isUserExists.company) {
		throw new Error("Company not found");
	}

	if (!payload.questionId) {
		throw new Error("Question id is required");
	}

	const question = await prisma.question.findUnique({
		where: {
			id: payload.questionId,
		},
		include: {
			assessment: {
				include: {
					company: true,
				},
			},
		},
	});

	if (!question) {
		throw new Error("Question not found");
	}

	if (question.assessment.company.id !== isUserExists.company.id) {
		throw new Error("You are not authorized to delete this question");
	}

	if (question.isDeleted || question.deletedAt) {
		throw new Error("Question already deleted!");
	}

	await prisma.question.update({
		where: {
			id: question.id,
		},
		data: {
			isDeleted: true,
			deletedAt: new Date(),
		},
	});
};

export const AssessmentServices = {
	createdAssessment,
	addQuestion,
	assessmentPublish,
	deleteQuestion,
};
