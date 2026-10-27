import {
	AttemptStatus,
	InvitationStatus,
	QuestionType,
	ResultStatus,
	UserRole,
} from "../../../generated/prisma/enums";
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

const submitAttempt = async (attemptId: string, user: IRequestUser) => {
	if (!attemptId) {
		throw new Error("AttemptID is required!");
	}

	const existingUser = await prisma.user.findUnique({
		where: { id: user.userId },
		include: { candidate: true },
	});

	if (!existingUser) {
		throw new Error("User doesn't exist!");
	}

	if (existingUser.role !== UserRole.CANDIDATE) {
		throw new Error("User not authorized!");
	}

	if (!existingUser.isActive) {
		throw new Error("User is not active!");
	}

	if (existingUser.isDeleted || existingUser.deletedAt) {
		throw new Error("User is deleted!");
	}

	const candidateId = existingUser.candidate?.id;

	if (!candidateId) {
		throw new Error("Candidate profile doesn't exist!");
	}

	const attempt = await prisma.attempt.findUnique({
		where: { id: attemptId },
		include: {
			assessment: {
				include: {
					questions: true,
				},
			},
			invitation: true,
		},
	});

	if (!attempt) {
		throw new Error("Attempt doesn't exist!");
	}

	if (attempt.submittedAt) {
		throw new Error("Assessment already submitted!");
	}

	if (attempt.candidateId !== candidateId) {
		throw new Error("You are not authorized for this attempt!");
	}

	if (
		!attempt.invitation ||
		attempt.invitation.status !== InvitationStatus.ACCEPT ||
		attempt.invitation.candidateId !== candidateId
	) {
		throw new Error("You are not invited to this assessment!");
	}

	const answers = await prisma.attemptAnswer.findMany({
		where: { attemptId },
		include: {
			question: true,
		},
	});

	const questions = attempt.assessment.questions;

	let obtainedMarks = 0;

	const totalMarks = questions.reduce(
		(total, question) => total + question.mark,
		0,
	);

	for (const item of answers) {
		if (item.question.type !== QuestionType.MCQ) {
			continue;
		}

		const submittedAnswer = item.answer?.trim();
		const correctAnswer = item.question.correctAnswer?.trim();

		if (
			submittedAnswer &&
			correctAnswer &&
			submittedAnswer.toLowerCase() === correctAnswer.toLowerCase()
		) {
			obtainedMarks += item.question.mark;
		}
	}

	const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

	const status = percentage >= 50 ? ResultStatus.PASSED : ResultStatus.FAILED;

	const totalAnswerRight = answers.filter(
		(answer) =>
			answer.question.type === QuestionType.MCQ &&
			answer.question.correctAnswer?.trim() === answer.answer?.trim(),
	).length;

	const totalWrongAnswers = answers.length - totalAnswerRight;

	const result = await prisma.$transaction(async (tx) => {
		const createdResult = await tx.result.create({
			data: {
				attemptId: attempt.id,
				totalMark: totalMarks,
				obtainedMark: obtainedMarks,
				percentage: percentage,
				totalAnswerRight: totalAnswerRight,
				totalAnswerWrong: totalWrongAnswers,
				resultStatus: status,
				createdAt: new Date(),
			},
		});

		await tx.attempt.update({
			where: { id: attempt.id },
			data: {
				submittedAt: new Date(),
				status: AttemptStatus.COMPLETED,
			},
		});

		return createdResult;
	});

	return {
		result: {
			id: result.id,
			attemptId: result.attemptId,
			totalMarks: result.totalMark,
			obtainedMarks: result.obtainedMark,
			percentage: result.percentage,
			status: result.resultStatus,
			totalAnswerRight: result.totalAnswerRight,
			totalWrongAnswers: result.totalAnswerWrong,
			totalQuestion: answers.length,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		},
	};
};

export const AttemptService = {
	getAllQuestions,
	getSingleQuestion,
	answerQuestion,
	submitAttempt,
};
