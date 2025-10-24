import { Router } from "express";
import * as userControllers from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import * as messageControllers from "../controllers/message.controller.js";

const userRouter = Router();

userRouter.route("/data").get(protect, userControllers.getUserData);
userRouter.route("/update").post(upload.fields([{name: "profile", maxCount: 1}, {name: "cover", maxCount: 1}]), protect, userControllers.updateUserData);
userRouter.route("/discover").post(protect, userControllers.discoverUsers);
userRouter.route("/follow").post(protect, userControllers.followUser);
userRouter.route("/unfollow").post(protect, userControllers.unfollowUser);
userRouter.route("/removeFollower").post(protect, userControllers.removeFromFollowers);

userRouter.route("/connect").post(protect, userControllers.sendConnectionRequest);
userRouter.route("/accept").post(protect, userControllers.acceptConnectionRequest);
userRouter.route("/reject").post(protect, userControllers.rejectConnectionRequest);
userRouter.route("/remove").post(protect, userControllers.removeFromConnections);
userRouter.route("/connections").post(protect, userControllers.getUserConnections);

userRouter.route("/profiles").post(userControllers.getUserProfiles);

userRouter.route("/recent-messages").get(protect, messageControllers.getUserRecentMessages)

export default userRouter;
