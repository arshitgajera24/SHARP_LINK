import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as commentController from "../controllers/comments.controller.js";

const commentRouter = Router();

commentRouter.route("/add").post(protect, commentController.addComment);
commentRouter.route("/:postId").get(protect, commentController.getAllComments);
commentRouter.route("/delete/:commentId").delete(protect, commentController.deleteComment);

export default commentRouter;