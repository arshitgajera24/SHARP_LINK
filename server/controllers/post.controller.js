import fs from "fs";
import imagekit from "../config/imagekit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { decryptText, encryptText } from "./message.controller.js";
import Notification from "../models/Notification.js";

//* Add Post
export const addPost = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {content, post_type} = req.body;
        const images = req.files;

        let image_urls = [];

        if(images.length)
        {
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path);
                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder: "posts",
                    })
                    
                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quanlity: "auto" },
                            { format: "webp" },
                            { width: '1280' },
                        ]
                    })
                    return url;
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            image_urls: image_urls.map(url => encryptText(url)),
            post_type
        });

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
        
        const user = await User.findById(userId);

        //! User Connections & Followings
        const userIds = [userId, ...user.connections || [], ...user.following || []];
        const posts = await Post.find({user: { $in: userIds }}).populate("user").sort({createdAt: -1});

        const decryptedPosts = posts.map(post => ({
            ...post._doc,
            image_urls: (post.image_urls || []).map(url => decryptText(url.toString())),
        }));

        res.json({success: true, posts: decryptedPosts});
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
                const liker = await User.findById(userId);

                await Notification.create({
                    to_user_id: post.user,
                    from_user_id: userId,
                    message: ` Liked Your Post`,
                    reference_id: postId,
                    reference_preview: post.image_urls[0] || null
                });
            }

            res.json({success: true, message: "Post Liked"});
        }
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get Single Post by ID
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const post = await Post.findById(id).populate('user', 'full_name username profile_picture').lean();        

        if (!post) {
            return res.json({ success: false, message: 'Post not found' });
        }

        const decryptedPost = {
            ...post,
            image_urls: post.image_urls.map(url => decryptText(url.toString())),
        };

        res.json({ success: true, post: decryptedPost });
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

        res.json({ success: true, message: "Post Deleted Successfully", deletedPostId: postId });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}
