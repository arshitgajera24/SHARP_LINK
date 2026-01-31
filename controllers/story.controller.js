import fs from "fs"
import imagekit from "../config/imagekit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";
import { decryptText, encryptText } from "./message.controller.js";
import redis from "../config/redis.js";

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
            const transformations = media_type === "image"
                                    ? [{ quality: "auto" }]
                                    : [{ height: "360" }, { format: "mp4" }];

            const url = imagekit.url({
                path: response.filePath,
                transformation: transformations
            })
            media_url = url;
        }

        //! Create Story
        const story = await Story.create({
            user: userId,
            content: encryptText(content),
            media_url: encryptText(media_url),
            media_type,
            background_color,
        })

        await redis.del(`stories:${userId}`);

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
        
        const cacheKey = `stories:${userId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        const user = await User.findById(userId);

        //! User Connections & Followings
        const userIds = [userId, ...user.connections, ...user.following];

        const stories = await Story.find({
            user: {$in: userIds}
        }).populate("user").sort({createdAt: -1});

        const decryptedStories = stories.map(story => ({
            ...story._doc,
            content: decryptText(story.content),
            media_url: decryptText(story.media_url)
        }));

        const responseData = { success: true, stories: decryptedStories };
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 20);

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Mark Story as Viewed
export const viewStory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { storyId } = req.params;

        const story = await Story.findById(storyId);
        if (!story) return res.json({ success: false, message: "Story not found" });

        if (story.user.toString() === userId) {
            return res.json({ success: false });
        }

        const alreadyViewed = story.view_count.some(
            (view) => view.user.toString() === userId
        );

        if (!alreadyViewed) {
            story.view_count.push({ user: userId, viewedAt: new Date() });
            await story.save();
        }

        await redis.del(`stories:${story.user}`);

        res.json({ success: true, message: "Story viewed successfully" });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get Story Viewers
export const getStoryViewers = async (req, res) => {
    try {
        const { storyId } = req.params;

        const story = await Story.findById(storyId).populate("view_count.user");

        if (!story) {
            return res.json({ success: false, message: "Story not found" });
        }        

        res.json({ success: true, viewers: story.view_count });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Delete Story
export const deleteStory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { storyId } = req.params;

        const story = await Story.findById(storyId);
        if (!story) return res.json({ success: false, message: "Story not found" });

        if (story.user.toString() !== userId) return res.json({ success: false, message: "Not authorized" });

        await story.deleteOne();

        await redis.del(`stories:${userId}`);

        res.json({ success: true, message: "Story Deleted Successfully", deletedStoryId: storyId });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}
