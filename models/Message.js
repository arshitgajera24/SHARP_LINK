import { model, Schema } from "mongoose";

const messageSchema = new Schema({
    from_user_id: { type: String, ref: "User", required: true },
    to_user_id: { type: String, ref: "User", required: true },
    text: { type: String, trim: true },
    message_type: { type: String, enum: ["text", "image", "post"] },
    media_url: { type: String },
    post_id: { type: String, ref: "Post" },
    seen: { type: Boolean, default: false },
}, {timestamps: true, minimize: false})

const Message = model("Message", messageSchema);

export default Message;