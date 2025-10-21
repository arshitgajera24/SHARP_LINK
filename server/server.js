import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/db.js";
import {inngest, functions} from "./inngest/index.js"
import {serve} from "inngest/express"
import { clerkMiddleware } from '@clerk/express'
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import storyRouter from "./routes/story.route.js";
import messageRouter from "./routes/message.route.js";

const app = express();
const PORT = process.env.PORT || 4000;

await connectDB();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: false,
}));

app.use(clerkMiddleware())

app.get("/", (req, res) => res.send("Backend Running Yeeeee !!"))
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/message", messageRouter);

app.listen(PORT, () => {
    console.log(`🔥 Server is Running on port http://localhost:${PORT}`);
})

