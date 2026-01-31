import imagekit from "../config/imagekit.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import fs from "fs"
import { decryptText, encryptText } from "./message.controller.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import redis from "../config/redis.js";

//* Get User Data
export const getUserData = async (req, res) => {
    try {
        const {userId} = req.auth();

        const user = await User.findById(userId);
        if(!user) return res.json({success: false, message: "User not Found"});

        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Update User Data
export const updateUserData = async (req, res) => {
    try {
        const {userId} = req.auth();
        let {username, bio, location, full_name} = req.body;

        const tempUser = await User.findById(userId);
        if(!tempUser) return res.json({success: false, message: "User not Found"});

        !username && (username = tempUser.username)

        if(tempUser.username !== username)
        {
            const user = await User.findOne({username});
            if(user)
            {
                //! We will not change username if it is already taken
                username = tempUser.username
            }
        }

        const updatedData = {
            username,
            bio,
            location,
            full_name
        }

        const profile = req.files.profile && req.files.profile[0]
        const cover = req.files.cover && req.files.cover[0]

        if(profile)
        {
            const buffer = fs.readFileSync(profile.path);
            const response = await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            })

            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quanlity: "auto" },
                    { format: "webp" },
                    { width: '512' },
                ]
            })
            updatedData.profile_picture = url;
        }

        if(cover)
        {
            const buffer = fs.readFileSync(cover.path);
            const response = await imagekit.upload({
                file: buffer,
                fileName: cover.originalname,
            })

            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quanlity: "auto" },
                    { format: "webp" },
                    { width: '1280' },
                ]
            })
            updatedData.cover_photo = url;
        }

        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true })

        await redis.del(`userProfile:${userId}`);

        res.json({success: true, user, message: "Profile Updated Successfully"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Find User using username, email, location, name
export const discoverUsers = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {input} = req.body;

        const allUsers = await User.find(
            {
                $or: [
                    { username: new RegExp(input, "i") },
                    { email: new RegExp(input, "i") },
                    { full_name: new RegExp(input, "i") },
                    { location: new RegExp(input, "i") },
                ]
            }
        )

        const filterUsers = allUsers.filter(user => user._id !== userId);

        res.json({success: true, users: filterUsers});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Follow User
export const followUser = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const user = await User.findById(userId);
        if(user.following.includes(id))
        {
            return res.json({success: false, message: "You are Already Following"});
        }
        user.following.push(id);
        await user.save();

        const toUser = await User.findById(id);
        toUser.followers.push(userId);
        await toUser.save();

        const existingFollowNotification = await Notification.findOne({
            to_user_id: id,
            from_user_id: userId,
            message: ` Started Following You`
        });

        if (!existingFollowNotification) {
            await Notification.create({
                to_user_id: id,
                from_user_id: userId,
                message: ` Started Following You`
            });
        }

        await redis.del(`userConnections:${userId}`);
        await redis.del(`userConnections:${id}`);
        await redis.del(`userProfile:${userId}`);
        await redis.del(`userProfile:${id}`);
    
        res.json({success: true, message: "Followed Successfully"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Unfollow User
export const unfollowUser = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const user = await User.findById(userId);
        user.following = user.following.filter(uid => uid.toString() !== id);
        await user.save();

        const toUser = await User.findById(id);
        toUser.followers = toUser.followers.filter(uid => uid.toString() !== userId);
        await toUser.save();

        await Notification.findOneAndDelete({
            to_user_id: id,
            from_user_id: userId,
            message: ` Started Following You`
        });

        await redis.del(`userConnections:${userId}`);
        await redis.del(`userConnections:${id}`);
        await redis.del(`userProfile:${userId}`);
        await redis.del(`userProfile:${id}`);

        res.json({success: true, message: "Unfollowed Successfully"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Send Connection Request
export const sendConnectionRequest = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const user = await User.findById(userId);

        //! user can send only 20 Request in 24 Hours
        const last24Hours = new Date(Date.now() - 24*60*60*1000);

        const connectionRequests = await Connection.find({
            from_user_id: userId, 
            createdAt: { $gt: last24Hours}
        })
        if(connectionRequests.length >= 20)
        {
            return res.json({success: false, message: "You Can not Send More than 20 Connection Requests in 24 Hours"});
        }

        //! Check User is Already Connected or Not
        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId },
            ]
        })
        if(!connection)
        {
            const newConnection = await Connection.create({
                from_user_id: userId,
                to_user_id: id,
            })

            await inngest.send({
                name: "app/connection-request",
                data: { connectionId: newConnection._id },
            })

            const existingConnectionNotification = await Notification.findOne({
                to_user_id: id,
                from_user_id: userId,
                message: ` Sent You a Connection Request`
            });

            if (!existingConnectionNotification) {
                await Notification.create({
                    to_user_id: id,
                    from_user_id: userId,
                    message: ` Sent You a Connection Request`
                });

                await redis.del(`userConnections:${userId}`);
                await redis.del(`userConnections:${id}`);
            }

            return res.json({success: true, message: "Connection Request Sent Successfully"});
        }
        else if(connection && connection.status === "accepted")
        {
            return res.json({success: false, message: "You are Already Connected"});
        }

        return res.json({success: false, message: "Connection Request Pending"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get User Connections
export const getUserConnections = async (req, res) => {
    try {
        const {userId} = req.auth();
        const profileId = req.body?.profileId || null;
        const targetUserId = profileId || userId;

        const cacheKey = `userConnections:${targetUserId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        const user = await User.findById(targetUserId).populate("connections followers following").lean();
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const connections = user.connections || [];
        const followers = user.followers || [];
        const following = user.following || [];

        const pendingConnections = (await Connection.find({ 
            to_user_id: targetUserId, 
            status: "pending" 
        }).populate("from_user_id")).map((connection) => connection.from_user_id);

        const responseData = {success: true, connections, followers, following, pendingConnections};
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 30);

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Accept Connection Request
export const acceptConnectionRequest = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const connection = await Connection.findOne({from_user_id: id, to_user_id: userId})
        if(!connection) return res.json({success: false, message: "Connection not Found"});

        const user = await User.findById(userId);
        if(user.connections.includes(id)) return;
        user.connections.push(id);
        await user.save();

        const toUser = await User.findById(id);
        if(toUser.connections.includes(userId)) return;
        toUser.connections.push(userId);
        await toUser.save();

        const existingUserNotification = await Notification.findOne({
            to_user_id: userId,
            from_user_id: id,
            message: ` and You are now Connected`
        });

        if (!existingUserNotification) {
            await Notification.create({
                to_user_id: userId,
                from_user_id: id,
                message: ` and You are now Connected`
            });
        }

        const existingToUserNotification = await Notification.findOne({
            to_user_id: id,
            from_user_id: userId,
            message: ` and You are now Connected`
        });

        if (!existingToUserNotification) {
            await Notification.create({
                to_user_id: id,
                from_user_id: userId,
                message: ` and You are now Connected`
            });
        }

        connection.status = "accepted";
        await connection.save();

        await redis.del(`userConnections:${userId}`);
        await redis.del(`userConnections:${id}`);
        
        res.json({success: true, message: "Connection Accepted Successfully" });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Reject Connection Request
export const rejectConnectionRequest = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const deletedConnection = await Connection.findOneAndDelete({ from_user_id: id, to_user_id: userId });
        if (!deletedConnection) return res.json({ success: false, message: "Connection not found" });

        await redis.del(`userConnections:${userId}`);
        await redis.del(`userConnections:${id}`);
        
        res.json({success: true, message: "Connection Rejected" });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Remove From Connections
export const removeFromConnections = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const deletedConnection = await Connection.findOneAndDelete({ from_user_id: id, to_user_id: userId });
        if (!deletedConnection) return res.json({ success: false, message: "Connection not found" });

        await User.findByIdAndUpdate(userId, {
            $pull: { connections: id }
        });

        await User.findByIdAndUpdate(id, {
            $pull: { connections: userId }
        });

        await redis.del(`userConnections:${userId}`);
        await redis.del(`userConnections:${id}`);
        
        res.json({success: true, message: "Connection Removed Successfully" });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get User Profiles
export const getUserProfiles = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {profileId} = req.body;

        const cacheKey = `userProfile:${profileId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const profile = await User.findById(profileId).lean();
        if(!profile) return res.json({success: false, message: "Profile not Found"});

        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: profileId },
                { from_user_id: profileId, to_user_id: userId }
            ]
        });

        const posts = await Post.find({user: profileId}).populate("user");

        const decryptedPosts = posts.map(post => ({
            ...post._doc,
            content: decryptText(post.content),
            image_urls: post.image_urls.map(url => decryptText(url)),
            video_url: decryptText(post.video_url)
        }));

        const responseData = { success: true, profile, posts: decryptedPosts, connectionStatus: connection ? connection.status : null };
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 30);

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Remove From Followers
export const removeFromFollowers = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const user = await User.findById(userId);
        if(!user.followers.includes(id))
        {
            return res.json({success: false, message: "Follower not Found"});
        }

        const otherUser = await User.findById(id);
        if(!otherUser.following.includes(userId))
        {
            return res.json({success: false, message: "Following not Found"});
        }

        await User.findByIdAndUpdate(userId, {
            $pull: { followers: id }
        });

        await User.findByIdAndUpdate(id, {
            $pull: { following: userId }
        });

        await redis.del(`userConnections:${userId}`);
        await redis.del(`userConnections:${id}`);
        await redis.del(`userProfile:${userId}`);
        await redis.del(`userProfile:${id}`);
        
        res.json({success: true, message: "Follower Removed Successfully" });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}


export const getUnseenCounts = async (req, res) => {
    try {
        const {userId} = req.auth();

        const [unreadMessages, unreadNotifications, pendingConnections] = await Promise.all([
            Message.countDocuments({ to_user_id: userId, seen: false }),
            Notification.countDocuments({ to_user_id: userId, read: false }),
            Connection.countDocuments({ to_user_id: userId, status: "pending" }),
        ]);

        res.json({ success: true, data: {
                unreadMessages,
                unreadNotifications,
                pendingConnections,
            },
        });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}
