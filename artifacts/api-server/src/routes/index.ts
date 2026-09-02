import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { notFound } from "../lib/errors";
import healthRouter from "./health";
import listsRouter from "./lists";
import profileRouter from "./profile";
import taskTypesRouter from "./task-types";
import tasksRouter from "./tasks";

const router: IRouter = Router();

// Health is the only unauthenticated route — it must answer before a user
// exists so deploys can be probed.
router.use(healthRouter);

// Everything below is user data. `requireAuth` sets `req.userId`, and every
// query beyond this line is scoped to it (spec § 5.7).
router.use(requireAuth);
router.use(listsRouter);
router.use(tasksRouter);
router.use(taskTypesRouter);
router.use(profileRouter);

// Anything under /api that matched no route above. Without this, Express's
// default handler answers with an HTML page and the client's fetch layer has
// nothing to parse — every API response should speak the Problem contract.
router.use((req, _res, next) => {
  next(notFound(`No route for ${req.method} ${req.baseUrl}${req.path}.`));
});

export default router;
