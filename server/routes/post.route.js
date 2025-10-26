import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import * as postControllers from "../controllers/post.controller.js";

const postRouter = Router();

postRouter.route("/add").post(upload.fields([ {name: "images", maxCount: 4}, {name: "video", maxCount: 1} ]), protect, postControllers.addPost);
postRouter.route("/feed").get(protect, postControllers.getFeedPosts);
postRouter.route("/like").post(protect, postControllers.likePost);
postRouter.route("/:id").get(protect, postControllers.getPostById);
postRouter.route("/delete/:postId").delete(protect, postControllers.deletePost);

export default postRouter;