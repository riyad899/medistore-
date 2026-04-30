import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../config/database";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        requireEmailVerification: true,
        async sendResetPassword({ user, url }) {
            await sendPasswordResetEmail(user.email, url);
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        async sendVerificationEmail({ user, url }) {
            await sendVerificationEmail(user.email, url);
        },
    },
    socialProviders: {
        google: {
            clientId:
                process.env.GOOGLE_CLIENT_ID ||
                process.env.Google_Client_ID ||
                "",
            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET ||
                process.env.Google_Client_Secret ||
                "",
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "CUSTOMER",
            },
            phone: {
                type: "string",
                required: false,
            },
            address: {
                type: "string",
                required: false,
            },
            isActive: {
                type: "boolean",
                required: false,
                defaultValue: true,
            },
        }
    },
    trustedOrigins: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        process.env.BETTER_AUTH_URL || "http://localhost:5001",
    ],
    advanced: {
        // Allow requests without an Origin header (Postman, curl, mobile apps).
        // Only disable in non-production; production keeps CSRF protection active.
        disableCSRFCheck: process.env.NODE_ENV !== "production",
    },
});
