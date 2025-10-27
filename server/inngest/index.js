import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../config/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

export const inngest = new Inngest({ id: "sharp-link" });

//* Save User data to Database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: "clerk/user.created" },
    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data;
        let username = email_addresses[0].email_address.split("@")[0];

        // Check Availability of Username
        const user = await User.findOne({username});
        if(user) {
            username = username + Math.floor(Math.random() * 10000);
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
            username
        }
        await User.create(userData);
    }
)

//* Update User data to Database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: "clerk/user.updated" },
    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data;

        const updateUserData = {
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
        }
        await User.findByIdAndUpdate(id, updateUserData);
    }
)


//* Delete User data to Database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: "clerk/user.deleted" },
    async ({event}) => {
        const {id} = event.data;

        await User.findByIdAndDelete(id);
    }
)

//* Send Email When New Connection Request Arrives
const sendNewConnectionRequestReminder = inngest.createFunction(
    { id: 'send-new-connection-request-reminder' },
    { event: "app/connection-request" },
    async ({event, step}) => {
        const {connectionId} = event.data;

        await step.run("send-connection-request-mail", async () => {
            const connection = await Connection.findById(connectionId).populate("from_user_id to_user_id");

            const subject = `👋 New Connection Request from SHARP LINK`;
            const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Hi ${connection.to_user_id.full_name},</h2>
                            <p>You have a New Connection Request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
                            <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to Accept or Reject the Request</p>
                            <br/>
                            <p>Thanks,<br/>SHARP LINK - Stay Connected</p>
                        </div>`;

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body
            })
            
        })

        const in24Hours = new Date(Date.now() + 24*60*60*1000)
        await step.sleepUntil("wait-for-24-hours", in24Hours);
        await step.run("send-connection-request-reminder", async () => {
            const connection = await Connection.findById(connectionId).populate("from_user_id to_user_id");

            if(connection.status === "accepted"){
                return {message: "Already Accepted"}
            }

            const subject = `👋 New Connection Request in SHARP LINK`;
            const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Hi ${connection.to_user_id.full_name},</h2>
                            <p>You have a New Connection Request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
                            <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to Accept or Reject the Request</p>
                            <br/>
                            <p>Thanks,<br/>SHARP LINK - Stay Connected</p>
                        </div>`;

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body,
            })

            return {message: "Reminder Sent"};
        })
    }
)


//* Delete Story After 24 Hours
const deleteStory = inngest.createFunction(
    { id: 'story-delete' },
    { event: "app/story.delete" },
    async ({event, step}) => {
        const {storyId} = event.data;
        const in24Hours = new Date(Date.now() + 24*60*60*1000);
        await step.sleepUntil("wait-for-24-hours", in24Hours);
        await step.run("delete-story", async () => {
            const story = await Story.findById(storyId);
            if (!story) return { message: "Already deleted" };

            await Story.findByIdAndDelete(storyId);
            return {message: "Story Expired"}
        })
    }
)

//* Backup cron cleanup (runs every 30 minutes to ensure no missed stories)
const cleanupExpiredStories = inngest.createFunction(
    { id: 'cleanup-expired-stories' },
    { cron: "*/30 * * * *" },
    async ({ step }) => {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await step.run("delete-old-stories", async () => {
            return await Story.deleteMany({ createdAt: { $lt: cutoff } });
        });
        return { deletedCount: result.deletedCount || 0 };
    }
);

//* Send Notification Of Unseen Messages
const SendNotificationOfUnseenMessages = inngest.createFunction(
    { id: 'send-unseen-messages-notification' },
    { cron: "TZ=America/New_York 0 9 * * *" }, //Everyday at 9 AM
    async ({step}) => {
        const messages = await Message.find({seen: false}).populate("to_user_id");
        const unSeenCount = {};

        messages.map(message => {
            unSeenCount[message.to_user_id._id] = (unSeenCount[message.to_user_id._id] || 0) + 1;
        })

        for(const userId in unSeenCount)
        {
            const user = await User.findById(userId);

            const subject = `📬 You have ${unSeenCount[userId]} Unseen Messages`;
            const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Hi ${user.full_name},</h2>
                            <p>You have ${unSeenCount[userId]} unseen messages</p>
                            <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color: #10b981;">here</a> to view them</p>
                            <br/>
                            <p>Thanks,<br/>SHARP LINK - Stay Connected</p>
                        </div>`;
            
                        await sendEmail({
                            to: user.email,
                            subject,
                            body,
                        })
        }
        return {message: "Notification Sent"}
    }
)

export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendNewConnectionRequestReminder,
    deleteStory,
    cleanupExpiredStories,
    SendNotificationOfUnseenMessages,
];