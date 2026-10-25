import { UserRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../auth/auth.interface";

const answerQuestion = async (
	questionId: string,
	attemptId: string,
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

	const attempt = await prisma.attempt.findUnique({
		where: {
			id: attemptId,
		},
	});

	if (!attempt) {
		throw new Error(`Attempt doesn't exits!`);
	}
};

export const AttemptService = {
	answerQuestion,
};
