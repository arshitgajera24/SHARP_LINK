import fs from "fs"
import imagekit from "../config/imagekit.js";
import Message from "../models/Message.js";

//* Create an Empty Object to Store Server-Side Event Collections
const connections = {};

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
            text,
            message_type: final_type,
            media_url: final_media_url,
            post_id,
        })

        res.json({success: true, message});

        //! Send Message to to_user_id using SSE
        const messageWithUserData = await Message.findById(message._id).populate("from_user_id to_user_id").populate({ 
            path: "post_id", 
            populate: { path: "user", select: "full_name username profile_picture" } 
        });

        if(connections[to_user_id]) {
            connections[to_user_id].write(`data: ${JSON.stringify({type:"newMessage", message: messageWithUserData})}\n\n`);
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

        res.json({success: true, messages});
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
        
        res.json({success: true, messages});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}
