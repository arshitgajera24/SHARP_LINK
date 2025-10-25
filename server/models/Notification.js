import mongoose, { model, Schema } from "mongoose";

const notificationSchema = new Schema({
    to_user_id: { type: String, ref: "User", required: true },
    from_user_id: { type: String, ref: "User" },
    message: { type: String, required: true },
    reference_id: { type: String },
    reference_preview: { type: String },
    read: { type: Boolean, default: false },
}, { timestamps: true, minimize: false });

const Notification = model("Notification", notificationSchema);

export default Notification;