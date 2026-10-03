import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AssessmentRoutes } from "./app/module/asstessment/assessment.route";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { InvitationRoutes } from "./app/module/invitation/invitation.route";
import { PaymentRoutes } from "./app/module/payment/payment.route";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Basic route
app.get("/", async (_req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message:
			"Welcome to Assessly - developer assessment and coding platform - Backend",
	});
});

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/payment", PaymentRoutes);
app.use("/api/v1/assessment", AssessmentRoutes);
app.use("/api/v1/invitation", InvitationRoutes);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
