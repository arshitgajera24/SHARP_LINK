import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as notificationsController from "../controllers/notifications.controller.js";

const notificationsRouter = Router();

notificationsRouter.route("/get").get(protect, notificationsController.getAllNotifications);
notificationsRouter.route("/delete/:notificationId").delete(protect, notificationsController.DeleteNotification);

export default notificationsRouter;