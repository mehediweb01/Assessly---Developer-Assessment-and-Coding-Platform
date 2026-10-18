import {
	AssessmentStatus,
	AttemptStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../auth/auth.interface";
import type {
	IAddQuestion,
	IAssessmentCreate,
	IUpdateQuestion,
} from "./assessment.interface";

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
			description: payload.description,
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

const editQuestion = async (
	payload: IUpdateQuestion,
	questionId: string,
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

	if (!isUserExists.company) {
		throw new Error("Company not found");
	}

	if (!isUserExists.isActive) {
		throw new Error("Company is not active");
	}

	if (isUserExists.isDeleted || isUserExists.deletedAt) {
		throw new Error("Company is deleted");
	}

	if (!questionId) {
		throw new Error("Question id is required");
	}

	const question = await prisma.question.findUnique({
		where: {
			id: questionId,
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

	if (
		question.assessment.status === AssessmentStatus.PUBLISHED ||
		question.assessment.status === AssessmentStatus.CLOSED
	) {
		throw new Error("You can't edit a published or closed question");
	}

	if (
		payload.title === question.title ||
		payload.mark === question.mark ||
		payload.correctAnswer === question.correctAnswer
	) {
		throw new Error("No changes found");
	}

	const updatedQuestion = await prisma.question.update({
		where: {
			id: question.id,
		},
		data: {
			title: payload.title,
			options: payload.options,
			mark: payload.mark,
			correctAnswer: payload.correctAnswer,
			description: payload.description,
		},
	});

	return {
		assessmentId: updatedQuestion.assessmentId,
		title: updatedQuestion.title,
		description: updatedQuestion.description,
		options: updatedQuestion.options,
		mark: updatedQuestion.mark,
		correctAnswer: updatedQuestion.correctAnswer,
	};
};

const startAssessment = async (assessmentId: string, user: IRequestUser) => {
	if (!assessmentId) {
		throw new Error("Assessment id is required");
	}

	const isUserExists = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			candidate: {
				include: {
					invitations: true,
				},
			},
		},
	});

	if (!isUserExists) {
		throw new Error("User not found");
	}

	if (isUserExists.isDeleted || isUserExists.deletedAt) {
		throw new Error("User is deleted");
	}

	if (!isUserExists.isActive) {
		throw new Error("User is not active");
	}

	if (isUserExists.role !== "CANDIDATE") {
		throw new Error("User is not a candidate");
	}

	const assessment = await prisma.assessment.findUnique({
		where: {
			id: assessmentId,
		},
	});

	if (!assessment) {
		throw new Error("Assessment not found");
	}

	if (assessment.status !== AssessmentStatus.PUBLISHED) {
		throw new Error("Assessment is not published");
	}

	if (new Date() < new Date(assessment.startDateTime)) {
		throw new Error("Assessment has not started yet");
	}

	if (new Date() > new Date(assessment.endDateTime)) {
		throw new Error("Assessment has ended");
	}

	const userAssessment = isUserExists.candidate?.invitations.find(
		(invitation) => invitation.assessmentId === assessment.id,
	);

	if (!userAssessment) {
		throw new Error("You are not invited to this assessment");
	}

	const existingAttempt = await prisma.attempt.findFirst({
		where: {
			candidateId: isUserExists.candidate?.id,
			assessmentId: assessment.id,
			status: AttemptStatus.IN_PROGRESS,
		},
	});

	if (existingAttempt) {
		if (existingAttempt.expiresAt <= new Date()) {
			await prisma.attempt.update({
				where: {
					id: existingAttempt.id,
				},
				data: {
					status: AttemptStatus.EXPIRED,
				},
			});
		} else {
			return existingAttempt;
		}
	}

	await prisma.attempt.create({
		data: {
			expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
			candidate: {
				connect: {
					id: isUserExists.candidate?.id,
				},
			},
			assessment: {
				connect: {
					id: assessment.id,
				},
			},
			invitation: {
				connect: {
					id: userAssessment.id,
				},
			},
			startedAt: new Date(),
			status: AttemptStatus.IN_PROGRESS,
		},
	});

	return {
		assessment: {
			assessmentId: assessment.id,
			title: assessment.title,
			startDateTime: assessment.startDateTime,
			endDateTime: assessment.endDateTime,
			status: assessment.status,
		},
	};
};

export const AssessmentServices = {
	createdAssessment,
	addQuestion,
	assessmentPublish,
	deleteQuestion,
	editQuestion,
	startAssessment,
};
