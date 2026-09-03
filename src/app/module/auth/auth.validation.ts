import z from "zod";

export const candidateRegistrationZodSchema = z.object({
	name: z
		.string("Not a string!")
		.min(3, "Name must be at least 3 characters")
		.max(25, "Name must be at most 25 characters"),
	email: z.email("Not a valid email address!"),
	password: z
		.string("Not a string!")
		.min(6, "Password must be at least 6 characters")
		.max(72, "Password must be at most 72 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
	candidate: z.object({
		phone: z
			.string("Not a valid phone number")
			.min(11, "Phone number must be at least 11 characters")
			.max(11, "Phone number must be at most 11 characters"),
		education: z
			.string("Not a valid education")
			.min(3, "Education must be at least 3 characters"),
		resumeUrl: z.url("Not a valid URL"),
		skills: z.array(z.string("Not a valid skill")).min(1, "At least one skill"),
	}),
});

export const EmailVerificationZodSchema = z.object({
	email: z.email("Not a valid email address!"),
	otp: z.string("Not a string!").length(6, "OTP must be 6 digits"),
});

export const LoginZodSchema = z.object({
	email: z.email("Not a valid email address!"),
	password: z.string("Not a string!"),
});

export const forgotPasswordZodSchema = z.object({
	email: z.email("Not a valid email address!"),
});

export const resetPasswordZodSchema = z.object({
	email: z.email("Not a valid email address!"),
	newPassword: z
		.string("Not a string!")
		.min(6, "Password must be at least 6 characters")
		.max(72, "Password must be at most 72 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
	otp: z.string("Not a string!").length(6, "OTP must be 6 digits"),
});

export const companyRegistrationZodSchema = z.object({
	name: z
		.string()
		.min(2, "Company name must be at least 2 characters")
		.max(150, "Company name must not exceed 150 characters"),

	email: z.string().email("Please provide a valid email address"),

	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(100, "Password must not exceed 100 characters"),

	company: z.object({
		description: z
			.string()
			.max(1000, "Description must not exceed 1000 characters")
			.optional(),

		website: z.string().url("Please provide a valid website URL").optional(),

		address: z
			.string()
			.max(500, "Address must not exceed 500 characters")
			.optional(),
	}),
});
