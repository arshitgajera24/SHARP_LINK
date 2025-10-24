import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import * as messageControllers from "../controllers/message.controller.js";

const messageRouter = Router();

messageRouter.route("/:userId").get(messageControllers.sseController);
messageRouter.route("/send").post(upload.single("image"), protect, messageControllers.sendMessage);
messageRouter.route("/get").post(protect, messageControllers.getChatMessages);
messageRouter.route("/delete/:messageId").delete(protect, messageControllers.deleteMessage);

export default messageRouter;