import { Router } from "express";
import foodRouter from "./food.routes.js";
import categoryRouter from "./category.routes.js";
import userRouter from "./user.routes.js";
import orderRouter from "./order.routes.js";
import restaurantRouter from "./restaurant.routes.js";
import stripeRouter from "./stripe.routes.js";
import onboardingRouter from "./onboarding.routes.js"; 
import verificationRouter from "./account-verification.routes.js";
import invitationRouter from "./invitation.routes.js";

const router = Router();

// Pagos
router.use("/checkout", stripeRouter);

// Usuarios
router.use("/users", userRouter);
router.use("/verification", verificationRouter)

// Estructura del restaurante
router.use("/restaurants", restaurantRouter);
router.use("/invitations", invitationRouter);
router.use("/onboarding", onboardingRouter);

// Menú y categorías
router.use("/categories", categoryRouter);
router.use("/order", orderRouter);
router.use("/dishes", foodRouter);

export default router;