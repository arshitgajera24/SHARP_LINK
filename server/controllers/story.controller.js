import fs from "fs"
import imagekit from "../config/imagekit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

//* Add User Story
export const addUserStory = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {content, media_type, background_color} = req.body;
        const media = req.file;

        let media_url = "";

        //! Upload Media to Imagekit
        if(media_type === "image" || media_type === "video")
        {
            const fileBuffer = fs.readFileSync(media.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quanlity: "auto" },
                    { format: "webp" },
                ]
            })
            media_url = url;
        }

        //! Create Story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color,
        })

        //! Schedule Story Deletion after 24 Hours
        await inngest.send({
            name: "app/story.delete",
            data: { storyId: story._id }
        });

        res.json({success: true, message: "Story Added Successfully" });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get User Stories
export const getUserStories = async (req, res) => {
    try {
        const {userId} = req.auth();
        const user = await User.findById(userId);

        //! User Connections & Followings
        const userIds = [userId, ...user.connections, ...user.following];

        const stories = await Story.find({
            user: {$in: userIds}
        }).populate("user").sort({createdAt: -1});

        res.json({success: true, stories });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}
