import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import departmentsRouter from "./departments.js";
import submissionsRouter from "./submissions.js";
import resourcesRouter from "./resources.js";
import resourceCategoriesRouter from "./resourceCategories.js";
import messagesRouter from "./messages.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(departmentsRouter);
router.use(submissionsRouter);
router.use(resourcesRouter);
router.use(resourceCategoriesRouter);
router.use(messagesRouter);

export default router;
