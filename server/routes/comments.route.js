import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as commentController from "../controllers/comments.controller.js";

const commentRouter = Router();

commentRouter.route("/add").post(protect, commentController.addComment);
commentRouter.route("/:postId").get(protect, commentController.getAllComments);

export default commentRouter;