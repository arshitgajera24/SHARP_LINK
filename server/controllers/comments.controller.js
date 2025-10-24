import Comment from "../models/Comments.js";
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

        const comments = await Comment.find({ post: postId }).populate("user").sort({ createdAt: -1 });

        const decryptedComments = comments.map(c => ({
            ...c._doc,
            text: decryptText(c.text.toString())
        }));

        res.json({ success: true, comments: decryptedComments });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}