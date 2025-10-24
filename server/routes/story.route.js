import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import * as storyControllers from "../controllers/story.controller.js";

const storyRouter = Router();

storyRouter.route("/create").post(upload.single("media"), protect, storyControllers.addUserStory);
storyRouter.route("/get").get(protect, storyControllers.getUserStories);
storyRouter.route("/view/:storyId").post(protect, storyControllers.viewStory);
storyRouter.route("/viewers/:storyId").get(protect, storyControllers.getStoryViewers);
storyRouter.route("/delete/:storyId").delete(protect, storyControllers.deleteStory);

export default storyRouter;