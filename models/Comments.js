import { model, Schema } from "mongoose";

const commentsSchema = new Schema({
    post: { type: String, ref: "Post", required: true },
    user: { type: String, ref: "User", required: true },
    text: [{ type: String }],
}, {timestamps: true, minimize: false})

const Comment = model("Comment", commentsSchema);

export default Comment;