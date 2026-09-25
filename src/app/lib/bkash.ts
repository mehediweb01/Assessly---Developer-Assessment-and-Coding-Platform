import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";
import { redisClient } from "./redis";

export const getGrandIdToken = async () => {
	try {
		const id_token_key = "bkash:id_token";
		const refresh_token_key = "bkash:refresh_token";

		let bkashIdToken = await redisClient.get(id_token_key);
		const bkashIdTokenTTL = await redisClient.ttl(id_token_key);

		const bkashRefreshToken = await redisClient.get(refresh_token_key);
		const bkashRefreshTokenTTL = await redisClient.ttl(refresh_token_key);

		if (bkashIdTokenTTL > 600) {
			return bkashIdToken;
		}

		if (
			(bkashIdTokenTTL <= 600 || !bkashIdToken) &&
			bkashRefreshToken &&
			bkashRefreshTokenTTL > 600
		) {
			const newTokenCreated = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						username: config.bkash_username,
						password: config.bkash_password,
					},
					body: JSON.stringify({
						app_key: config.bkash_app_key,
						app_secret: config.bkash_app_secret,
						refresh_token: bkashRefreshToken,
					}),
				},
			);

			if (!newTokenCreated.ok) {
				throw new AppError(httpStatus.BAD_REQUEST, "Token refresh failed!");
			}

			const result = await newTokenCreated.json();

			const token = await redisClient.set(id_token_key, result.id_token, {
				expiration: {
					type: "EX",
					value: 60 * 60,
				},
			});

			bkashIdToken = token;

			return bkashIdToken;
		}

		const grandToken = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
				}),
			},
		);

		if (!grandToken.ok) {
			throw new AppError(httpStatus.BAD_REQUEST, `Grand token failed!`);
		}

		const result = await grandToken.json();

		await redisClient.set(id_token_key, result.id_token, {
			expiration: {
				type: "EX",
				value: 60 * 60,
			},
		});

		await redisClient.set(refresh_token_key, result.refresh_token, {
			expiration: {
				type: "EX",
				value: 60 * 60 * 24 * 28,
			},
		});

		bkashIdToken = result.id_token;

		return bkashIdToken;
	} catch (error) {
		console.log(error);
	}
};
