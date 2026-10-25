import bcrypt from "bcryptjs";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { UserRole } from "./generated/prisma/enums";

async function main() {
	const email = config.admin_email?.trim().toLowerCase();
	const password = config.admin_password;

	if (!email || !password) {
		throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
	}

	if (password.length < 10) {
		throw new Error("Admin password must be at least 10 characters");
	}

	const existingAdmin = await prisma.user.findUnique({
		where: { email },
	});

	if (existingAdmin) {
		if (existingAdmin.role !== "ADMIN") {
			throw new Error("This email already belongs to a non-admin user");
		}

		console.log("Admin already exists");
		return;
	}

	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.create({
		data: {
			name: "Admin",
			email,
			password: hashedPassword,
			role: UserRole.ADMIN,
		},
	});

	console.log("Initial admin created");
}

export const initialAdminCreate = {
	main,
};
