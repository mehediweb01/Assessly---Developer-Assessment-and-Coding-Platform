import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
const app = express();
app.use(cors({
    origin: config.frontend_url,
    credentials: true,
}));
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
// Basic route
app.get("/", async (_req, res) => {
    res.status(httpStatus.OK).json({
        success: true,
        message: "Welcome to PH Healthcare System Backend",
    });
});
app.use(globalErrorHandler);
app.use(notFound);
export default app;
