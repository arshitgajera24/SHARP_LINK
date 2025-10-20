import { Router } from "express";
import * as userControllers from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";

const userRouter = Router();

userRouter.route("/data").get(protect, userControllers.getUserData);
userRouter.route("/update").post(upload.fields([{name: "profile", maxCount: 1}, {name: "cover", maxCount: 1}]), protect, userControllers.updateUserData);
userRouter.route("/discover").post(protect, userControllers.discoverUsers);
userRouter.route("/follow").post(protect, userControllers.followUser);
userRouter.route("/unfollow").post(protect, userControllers.unfollowUser);

userRouter.route("/connect").post(protect, userControllers.sendConnectionRequest);
userRouter.route("/accept").post(protect, userControllers.acceptConnectionRequest);
userRouter.route("/connections").get(protect, userControllers.getUserConnections);

export default userRouter;
