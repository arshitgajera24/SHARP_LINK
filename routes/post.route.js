import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as postControllers from "../controllers/post.controller.js";
import ImageKit from "imagekit";

const postRouter = Router();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

postRouter.route("/imagekit").get((req, res) => {
    const authParams = imagekit.getAuthenticationParameters();
    res.json(authParams);
})

postRouter.route("/add").post(protect, postControllers.addPost);
postRouter.route("/feed").get(protect, postControllers.getFeedPosts);
postRouter.route("/like").post(protect, postControllers.likePost);
postRouter.route("/:id").get(protect, postControllers.getPostById);
postRouter.route("/delete/:postId").delete(protect, postControllers.deletePost);

export default postRouter;