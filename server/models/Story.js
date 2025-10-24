import { model, Schema } from "mongoose";

const storySchema = new Schema({
    user: { type: String, ref: "User", required: true },
    content: { type: String },
    media_url: { type: String },
    media_type: { type: String, enum: ["text", "image", "video"]},
    view_count: [{ user: { type: String, ref: "User" }, viewedAt: { type: Date, default: Date.now } }],
    background_color: { type: String },
}, {timestamps: true, minimize: false})

const Story = model("Story", storySchema);

export default Story;