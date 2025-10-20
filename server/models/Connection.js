import mongoose, { model, Schema } from "mongoose";

const connectionSchema = new Schema({
    from_user_id: {type: String, ref: "User", required: true},
    to_user_id: {type: String, ref: "User", required: true},
    status: {type: String, enum: ["pending", "accepted"], default: "pending"},
}, {timestamps: true})

const Connection = model("Connection", connectionSchema);

export default Connection;