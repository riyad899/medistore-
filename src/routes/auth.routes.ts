import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";
import { Router } from "express";

const authRouter = Router();

// Better Auth handles all auth routes automatically (sign-in, sign-up, google, etc.)
authRouter.all("*", async (req, res) => {
    return toNodeHandler(auth)(req, res);
});

export default authRouter;
