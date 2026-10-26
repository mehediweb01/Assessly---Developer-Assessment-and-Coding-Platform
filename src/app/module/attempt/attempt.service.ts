import { UserRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { IRequestUser } from "../auth/auth.interface";

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

  const result = await prisma.$transaction(async (tx) => {
    const attemptAnswer = await tx.attemptAnswer.create({
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

    const totalQuestions = await tx.question.count({
      where: {
        assessmentId: attempt.assessmentId,
      },
    });

    const answeredQuestions = await tx.attemptAnswer.count({
      where: {
        attemptId: attempt.id,
      },
    });

    if (answeredQuestions >= totalQuestions) {
      await tx.attempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          submittedAt: new Date(),
        },
      });
    }

    return attemptAnswer;
  });

  return result;
};

export const AttemptService = {
  answerQuestion,
};
