import { InvitationStatus, UserRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../auth/auth.interface";

const getAllQuestions = async (assessmentId: string, user: IRequestUser) => {
	if (!assessmentId) {
		throw new Error(`AssessmentId is required!`);
	}

	const isExistingUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			candidate: true,
		},
	});

	if (!isExistingUser) {
		throw new Error(`User doesn't exist!`);
	}

	if (!isExistingUser.isActive) {
		throw new Error(`User is not active!`);
	}

	if (isExistingUser.isDeleted || isExistingUser.deletedAt) {
		throw new Error(`User is deleted!`);
	}

	const assessment = await prisma.assessment.findUnique({
		where: {
			id: assessmentId,
		},
	});

	if (!assessment) {
		throw new Error(`Assessment doesn't exist!`);
	}

	if (assessment.isDeleted || assessment.deletedAt) {
		throw new Error(`Assessment is deleted!`);
	}

	const questions = await prisma.question.findMany({
		where: {
			assessmentId: assessmentId,
		},
		select: {
			id: true,
			title: true,
			type: true,
			options: true,
			isDeleted: true,
			deletedAt: true,
			description: true,
			mark: true,
			inputFormat: true,
			outputFormat: true,
			starterCode: true,
			assessment: {
				select: {
					id: true,
					title: true,
					startDateTime: true,
					endDateTime: true,
					isDeleted: true,
					deletedAt: true,
					description: true,
					duration: true,
				},
			},
		},
	});

	return questions;
};

const getSingleQuestion = async (questionId: string, user: IRequestUser) => {
	if (!questionId) {
		throw new Error(`QuestionId is required!`);
	}

	const isExistingUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			candidate: true,
		},
	});

	if (!isExistingUser) {
		throw new Error(`User doesn't exist!`);
	}

	if (!isExistingUser.isActive) {
		throw new Error(`User is not active!`);
	}

	if (isExistingUser.isDeleted || isExistingUser.deletedAt) {
		throw new Error(`User is deleted!`);
	}

	const question = await prisma.question.findUnique({
		where: {
			id: questionId,
		},
		select: {
			id: true,
			title: true,
			type: true,
			options: true,
			isDeleted: true,
			deletedAt: true,
			description: true,
			mark: true,
			inputFormat: true,
			outputFormat: true,
			starterCode: true,
			assessment: {
				select: {
					id: true,
					title: true,
					startDateTime: true,
					endDateTime: true,
					isDeleted: true,
					deletedAt: true,
					description: true,
					duration: true,
				},
			},
		},
	});

	if (!question) {
		throw new Error(`Question doesn't exist!`);
	}

	if (question.isDeleted || question.deletedAt) {
		throw new Error(`Question is deleted!`);
	}

	return question;
};

const answerQuestion = async (
	questionId: string,
	attemptId: string,
	answer: string,
	user: IRequestUser,
) => {
	if (!questionId) {
		throw new Error(`QuestionId is required!`);
	}

	if (!attemptId) {
		throw new Error(`AttemptID is required!`);
	}

	const isExistingUser = await prisma.user.findUnique({
		where: {
			id: user.userId,
		},
		include: {
			candidate: true,
		},
	});

	if (!isExistingUser) {
		throw new Error(`User doesn't exist!`);
	}

	if (isExistingUser.role !== UserRole.CANDIDATE) {
		throw new Error(`User not authorized!`);
	}

	if (!isExistingUser.isActive) {
		throw new Error(`User is not active!`);
	}

	if (isExistingUser.isDeleted || isExistingUser.deletedAt) {
		throw new Error(`User is deleted!`);
	}

	const attempt = await prisma.attempt.findUnique({
		where: {
			id: attemptId,
		},
		include: {
			assessment: true,
		},
	});

	if (!attempt) {
		throw new Error(`Attempt doesn't exits!`);
	}

	if (attempt.submittedAt) {
		throw new Error(`Assessment already submitted! `);
	}

	if (attempt.candidateId !== isExistingUser.candidate?.id) {
		throw new Error("You are not authorized for this attempt!");
	}

	const question = await prisma.question.findUnique({
		where: {
			id: questionId,
		},
		include: {
			assessment: {
				include: {
					invitations: true,
				},
			},
		},
	});

	if (!question) {
		throw new Error(`Doesn't exits question!`);
	}

	if (question.assessmentId !== attempt.assessmentId) {
		throw new Error(
			"This question doesn't belong to the attempted assessment!",
		);
	}

	const invitation = question.assessment.invitations.find(
		(invitation) => invitation.candidateId === isExistingUser.candidate?.id,
	);

	if (!invitation) {
		throw new Error("You are not invited to this assessment!");
	}

	if (invitation.status !== InvitationStatus.ACCEPT) {
		throw new Error("You are not invited to this assessment!");
	}

	const isQuestionAttemptAnswer = await prisma.attemptAnswer.findFirst({
		where: {
			questionId: question.id,
			attemptId: attempt.id,
		},
	});

	if (isQuestionAttemptAnswer) {
		throw new Error(`You have already attempted this question!`);
	}

	const attemptAnswer = await prisma.attemptAnswer.create({
		data: {
			attempt: {
				connect: {
					id: attempt.id,
				},
			},
			answer,
			question: {
				connect: {
					id: question.id,
				},
			},
		},
	});

	return attemptAnswer;
};

export const AttemptService = {
	getAllQuestions,
	getSingleQuestion,
	answerQuestion,
};
