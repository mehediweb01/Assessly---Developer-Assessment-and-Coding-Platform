export interface IAssessmentCreate {
	title: string;
	startDateTime: string;
	endDateTime: string;
}

export interface IAddQuestion {
	title: string;
	type: "MCQ" | "WRITTEN" | "CODING";
	mark: number;
	options: string[];
	description?: string;
	correctAnswer: string;
	assessmentId: string;
}

export interface IUpdateQuestion {
	title: string;
	mark: number;
	options: string[];
	description: string;
	correctAnswer: string;
}
