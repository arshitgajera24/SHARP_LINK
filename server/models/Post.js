import { model, Schema } from "mongoose";

const postSchema = new Schema({
    user: { type: String, ref: "User", required: true },
    content: { type: String },
    image_urls: [{ type: String }],
    post_type: { type: String, enum: ["text", "image", "text_with_image"], required: true },
    likes_count: [{ type: String, ref: "User" }],
}, {timestamps: true, minimize: false})

const Post = model("Post", postSchema);

export default Post;