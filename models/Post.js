import { model, Schema } from "mongoose";

const postSchema = new Schema({
    user: { type: String, ref: "User", required: true },
    content: { type: String },
    image_urls: [{ type: String }],
    video_url: { type: String },
    post_type: { type: String, enum: ["text", "image", "text_with_image", "video", "text_with_video"], required: true },
    likes_count: [{ type: String, ref: "User" }],
}, {timestamps: true, minimize: false})

const Post = model("Post", postSchema);

export default Post;