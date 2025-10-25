import Notification from "../models/Notification.js";
import { decryptText } from "./message.controller.js";


//* Get All Notifications of Current User
export const getAllNotifications = async (req, res) => {
    try {
        const { userId } = req.auth();

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

        res.json({ success: true, notifications: decryptedNotifications });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//* Delete Notification 
export const DeleteNotification = async (req, res) => {
    try {
        const {notificationId} = req.params;
        await Notification.findByIdAndDelete(notificationId);
        res.json({ success: true, message: "Notification Deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}