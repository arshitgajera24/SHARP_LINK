import mongoose, { model, Schema } from "mongoose";

const userSchema = new Schema({
    _id: { type: String, required: true },
    email: { type: String, required: true },
    full_name: { type: String, required: true },
    username: { type: String, unique: true },
    bio: { type: String, default: "Hey there, I am Using Sharp Link." },
    profile_picture: { type: String, default: "" },
    cover_photo: { type: String, default: "" },
    location: { type: String, default: "" },
    followers: [{ type: String, ref: "User" }],
    following: [{ type: String, ref: "User" }],
    connections: [{ type: String, ref: "User" }],
}, {timestamps: true, minimize: false})

const User = model("User", userSchema)

export default User;