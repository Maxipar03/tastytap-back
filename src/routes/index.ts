import { Router } from "express";
import accesRouter from "./accesRouter.js";
import foodRouter from "./foodRouter.js";
import categoryRouter from "./categoryRouter.js";
import userRouter from "./userRouter.js";
import tableRouter from "./tableRouter.js";
import orderRouter from "./orderRouter.js";
import tableSessionRouter from "./tableSessionRouter.js";
import restaurantRouter from "./restaurantRouter.js";
import stripeRouter from "./stripeRouter.js";

const router = Router();

router.use("/checkout", stripeRouter);
router.use("/users", userRouter);
router.use("/restaurants", restaurantRouter);
router.use("/tableSession", tableSessionRouter);
router.use("/categories", categoryRouter);
router.use("/order", orderRouter);
router.use("/dishes", foodRouter);
router.use("/tables", tableRouter);
router.use("/access", accesRouter);

export default router;