import fs from "fs"
import imagekit from "../config/imagekit.js";
import Message from "../models/Message.js";
import crypto from "crypto"

const IV_LENGTH=16

//* Create an Empty Object to Store Server-Side Event Collections
export const connections = {};

//* Controller Function for Server-Side Event End-point
export const sseController = (req, res) => {
    const {userId} = req.params;
    console.log("New Client Connected : ", userId);

    //? Set Server-Side Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    //? Add the Client's Response Object to Connections Object
    connections[userId] = res;

    //? Send an Initial Event to the Client
    res.write(`data: ${JSON.stringify({ type: "connected", message: "Connected to SSE Stream" })}\n\n`);

    //? Handle Client Disconnection
    req.on("close", () => {
        //? Remove Client's response Object from Connections Array
        delete connections[userId];
        console.log("Client Disconnected : ", userId);
    })
}

export const encryptText = (text) => {
    try {
        if (!text) return text;
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
        console.log("Encryption error:", error.message);
        return text;
    }
}

export const decryptText = (encryptedText) => {
    try {
        if (typeof encryptedText !== "string" || !encryptedText.includes(":")) {
            return encryptedText;
        }

        const [ivHex, encrypted] = encryptedText.split(":");
        const iv = Buffer.from(ivHex, "hex");

        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(process.env.ENCRYPTION_KEY), iv );

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        console.log("Decryption error:", error.message);
        return encryptedText;
    }
}

//* Send Message
export const sendMessage = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id, text, post_id, message_type, media_url } = req.body;
        const image = req.file;

        let final_type = message_type || "text";
        let final_media_url = media_url || "";

        if(image)
        {
            const fileBuffer = fs.readFileSync(image.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            })
            final_media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: "auto" },
                    { format: "webp" },
                    { width: "1280" },
                ]
            })
            final_type = "image";
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text: encryptText(text),
            message_type: final_type,
            media_url: final_media_url ? encryptText(final_media_url) : "",
            post_id,
        })

        const decryptedMessage = {
            ...message._doc,
            text: decryptText(message.text),
            media_url: decryptText(message.media_url)
        };

        res.json({success: true, message: decryptedMessage});

        //! Send Message to to_user_id using SSE
        const messageWithUserData = await Message.findById(message._id).populate("from_user_id to_user_id").populate({ 
            path: "post_id", 
            populate: { path: "user", select: "full_name username profile_picture" } 
        });

        if (connections[to_user_id]) {
            const decryptedForReceiver = {
                ...messageWithUserData._doc,
                text: decryptText(messageWithUserData.text),
                media_url: decryptText(messageWithUserData.media_url)
            };
            connections[to_user_id].write(`data: ${JSON.stringify({ type: "newMessage", message: decryptedForReceiver })}\n\n`);
        }

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get Chat Messages
export const getChatMessages = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id} = req.body;

        const messages = await Message.find({
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId},
            ]
        }).populate({ path: "post_id", populate: { path: "user", select: "full_name username profile_picture" }}).sort({createdAt: -1});

        const decryptedMessages = messages.map(msg => ({
            ...msg._doc,
            text: decryptText(msg.text),
            media_url: decryptText(msg.media_url)
        }));

        //! Mark Messages as Seen
        const messagesToMark = await Message.find({from_user_id: to_user_id, to_user_id: userId, seen: false});
        const messageIds = messagesToMark.map(msg => msg._id);

        if(messageIds.length > 0) {
            await Message.updateMany({ _id: { $in: messageIds } }, { seen: true });
            if (connections[to_user_id]) {
                connections[to_user_id].write(
                    `data: ${JSON.stringify({ type: "messageSeen", userId, messageIds })}\n\n`
                );
            }
        }

        res.json({success: true, messages: decryptedMessages});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Get Recent User Messages
export const getUserRecentMessages = async (req, res) => {
    try {
        const {userId} = req.auth();

        const messages = await Message.find({
            $or: [
                { to_user_id: userId },
                { from_user_id: userId }
            ]
        }).populate("from_user_id to_user_id").populate({path: 'post_id', populate: { path: 'user', select: 'full_name username profile_picture' }}).sort({createdAt: -1});
        
        const decryptedMessages = messages.map(msg => ({
            ...msg._doc,
            text: decryptText(msg.text),
            media_url: decryptText(msg.media_url)
        }));

        res.json({success: true, messages: decryptedMessages});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

//* Delete Message
export const deleteMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) return res.json({ success: false, message: "Message not found" });

        await message.deleteOne();

        res.json({ success: true, message: "Message Deleted", deletedMessageId: messageId });
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}
