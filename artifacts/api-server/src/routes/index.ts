import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import templatesRouter from "./templates";
import exportsRouter from "./exports";
import generateRouter from "./generate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(documentsRouter);
router.use(templatesRouter);
router.use(exportsRouter);
router.use(generateRouter);

export default router;
