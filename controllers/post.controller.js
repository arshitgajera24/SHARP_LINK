import fs from "fs";
import imagekit from "../config/imagekit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { decryptText, encryptText } from "./message.controller.js";
import Notification from "../models/Notification.js";
import redis from "../config/redis.js";

//* Add Post
export const addPost = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {content, post_type, images, video} = req.body;

        const post = await Post.create({
            user: userId,
            content,
            image_urls: images?.map(url => encryptText(url)) || [],
            video_url: encryptText(video || ""),
            post_type
        });

        await redis.del(`feed:${userId}`);
        await redis.del(`userProfile:${userId}`);
        await redis.del(`userProfile:${post.user}`);

        res.json({success: true, message: "Post Uploaded Successfully"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get Feed Posts
export const getFeedPosts = async (req, res) => {
    try {
        const {userId} = req.auth();

        const cacheKey = `feed:${userId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        const user = await User.findById(userId);

        //! User Connections & Followings
        const userIds = [userId, ...user.connections || [], ...user.following || []];
        const posts = await Post.find({user: { $in: userIds }}).populate("user").sort({createdAt: -1});

        const decryptedPosts = posts.map(post => ({
            ...post._doc,
            image_urls: (post.image_urls || []).map(url => decryptText(url.toString())),
            video_url: decryptText(post.video_url?.toString()),
        }));

        const responseData = { success: true, posts: decryptedPosts };

        await redis.set(cacheKey, JSON.stringify(responseData), "EX",60);

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Like Posts
export const likePost = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {postId} = req.body;

        const post = await Post.findById(postId);

        if(post.likes_count.includes(userId))
        {
            post.likes_count = post.likes_count.filter(user => user !== userId);
            await post.save();

            await Notification.deleteOne({
                to_user_id: post.user,
                from_user_id: userId,
                reference_id: postId,
                message: { $regex: /liked your post/i }
            });

            res.json({success: true, message: "Post Unliked"});
        }
        else
        {
            post.likes_count.push(userId);
            await post.save();

            if(post.user !== userId)
            {
                await Notification.create({
                    to_user_id: post.user,
                    from_user_id: userId,
                    message: ` Liked Your Post`,
                    reference_id: postId,
                    reference_preview: post.video_url ? post.video_url : post.image_urls[0] || null
                });
            }

            res.json({success: true, message: "Post Liked"});
        }
        await redis.del(`post:${postId}`);
        await redis.del(`feed:${userId}`);
        await redis.del(`feed:${post.user}`);
        await redis.del(`userProfile:${userId}`);
        await redis.del(`userProfile:${post.user}`);
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get Single Post by ID
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const cacheKey = `post:${id}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        const post = await Post.findById(id).populate('user', 'full_name username profile_picture');        

        if (!post) {
            return res.json({ success: false, message: 'Post not found' });
        }

        const decryptedPost = {
            ...post,
            image_urls: post.image_urls.map(url => decryptText(url.toString())),
            video_url: decryptText(post.video_url?.toString()),
        };

        const responseData = { success: true, post: decryptedPost };
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 300);

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Delete post
export const deletePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) return res.json({ success: false, message: "Post not found" });

        if (post.user.toString() !== userId) return res.json({ success: false, message: "Not authorized" });

        await post.deleteOne();

        await redis.del(`post:${postId}`);
        await redis.del(`feed:${userId}`);
        await redis.del(`feed:${post.user}`);
        await redis.del(`userProfile:${userId}`);
        await redis.del(`userProfile:${post.user}`);

        res.json({ success: true, message: "Post Deleted Successfully", deletedPostId: postId });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}
