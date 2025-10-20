import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import * as postControllers from "../controllers/post.controller.js";

const postRouter = Router();

postRouter.route("/add").post(upload.array("images", 4), protect, postControllers.addPost);
postRouter.route("/feed").get(protect, postControllers.getFeedPosts);
postRouter.route("/like").post(protect, postControllers.likePost);

export default postRouter;