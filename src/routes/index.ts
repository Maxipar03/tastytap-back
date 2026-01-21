import { Router } from "express";
import accesRouter from "./access.routes.js";
import foodRouter from "./food.routes.js";
import categoryRouter from "./category.routes.js";
import userRouter from "./user.routes.js";
import tableRouter from "./table.routes.js";
import orderRouter from "./order.routes.js";
import tableSessionRouter from "./table-session.routes.js";
import restaurantRouter from "./restaurant.routes.js";
import stripeRouter from "./stripe.routes.js";
import dashboardRouter from "./dashboard.routes.js";
import restaurantInvitationRouter from "./restaurant-invitation.routes.js";

const router = Router();

router.use("/checkout", stripeRouter);
router.use("/users", userRouter);
router.use("/restaurant", restaurantRouter);
router.use("/onboarding", restaurantInvitationRouter);
router.use("/tableSession", tableSessionRouter);
router.use("/categories", categoryRouter);
router.use("/order", orderRouter);
router.use("/dishes", foodRouter);
router.use("/tables", tableRouter);
router.use("/access", accesRouter);
router.use("/dashboard", dashboardRouter);

export default router;