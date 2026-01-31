import redis from "../config/redis.js";
import Notification from "../models/Notification.js";
import { decryptText } from "./message.controller.js";


//* Get All Notifications of Current User
export const getAllNotifications = async (req, res) => {
    try {
        const { userId } = req.auth();

        const cacheKey = `notifications:${userId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        await Notification.updateMany({ to_user_id: userId }, {read: true});
        const notifications = await Notification.find({ to_user_id: userId }).populate("from_user_id", "username full_name profile_picture").sort({ createdAt: -1 });

        const decryptedNotifications = notifications.map((n) => {
            const reference_preview = n.reference_preview ? decryptText(n.reference_preview.toString()) : null;
            let decryptedMessage = n.message;

            const commentMatch = n.message.match(/Commented:\s*"(.+)"/);
            if (commentMatch && commentMatch[1]) {
                try {
                    const decryptedComment = decryptText(commentMatch[1]);
                    decryptedMessage = n.message.replace(commentMatch[1], decryptedComment);
                } catch (err) {
                    console.log("Error decrypting comment in notification:", err.message);
                }
            }

            return {
                ...n._doc,
                message: decryptedMessage,
                reference_preview,
            };
        });

        const responseData = { success: true, notifications: decryptedNotifications }
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 30);

        res.json(responseData);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//* Delete Notification 
export const DeleteNotification = async (req, res) => {
    try {
        const {notificationId} = req.params;
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.json({ success: false, message: "Notification not found" });
        }
        await Notification.findByIdAndDelete(notificationId);
        await redis.del(`notifications:${notification.to_user_id}`);
        res.json({ success: true, message: "Notification Deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}