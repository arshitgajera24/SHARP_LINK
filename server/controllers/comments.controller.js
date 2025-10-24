import Comment from "../models/Comments.js";


//* Add Comment
export const addComment = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {postId, text} = req.body;
        const comment = await Comment.create({
            post: postId,
            user: userId,
            text,
        })

        const populatedComment = await Comment.findById(comment._id).populate("user");

        res.json({success: true, comment: populatedComment});
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

        res.json({success: true, comments});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}