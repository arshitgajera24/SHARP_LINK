import redis from "../config/redis.js";
import Comment from "../models/Comments.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";
import { decryptText, encryptText } from "./message.controller.js";


//* Add Comment
export const addComment = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {postId, text} = req.body;
        const comment = await Comment.create({
            post: postId,
            user: userId,
            text: encryptText(text),
        })

        const populatedComment = await Comment.findById(comment._id).populate("user");

        const decryptedComment = {
            ...populatedComment._doc,
            text: decryptText(populatedComment.text)
        };

        const post = await Post.findById(postId);
        console.log(post + " -> " + post.user + " -> " + userId);
        

        if (post && post.user.toString() !== userId) {
            await Notification.create({
                to_user_id: post.user,
                from_user_id: userId,
                message: ` Commented: "${decryptedComment.text}"`,
                reference_id: postId,
                reference_preview: post.video_url ? post.video_url : post.image_urls[0] || null
            });
            console.log("notification");
        }

        await redis.del(`allComments:${postId}`);
        await redis.del(`post:${postId}`);

        res.json({success: true, comment: decryptedComment});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get All Comments
export const getAllComments = async (req, res) => {
    try {
        const {postId} = req.params;   
        
        const cacheKey = `allComments:${postId}`;
        const cached = await redis.get(cacheKey);
        if(cached)
        {
            return res.json(JSON.parse(cached));
        }

        const comments = await Comment.find({ post: postId }).populate("user").sort({ createdAt: -1 });

        const decryptedComments = comments.map(c => ({
            ...c._doc,
            text: decryptText(c.text.toString())
        }));

        const responseData = { success: true, comments: decryptedComments };
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 30);

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Delete Comment
export const deleteComment = async (req, res) => {
    try {
        const {commentId} = req.params;

        const comment = await Comment.findById(commentId);
        await Comment.findByIdAndDelete(commentId);

        if (!comment) {
            return res.json({ success: false, message: "Comment not found" });
        }

        await redis.del(`allComments:${comment.post}`);
        await redis.del(`post:${comment.post}`);

        res.json({ success: true, message: "Comment Deleted" });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}