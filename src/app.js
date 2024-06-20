import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// app.use(cors());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

//~ to set data upcoming format with limit
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));

//~ for temporary static access of files
app.use(express.static("public"));

//~ for cookie setting
app.use(cookieParser());


//~ routes imports
import userRouter from "./routes/user_routes.js";
import healthcheckRouter from "./routes/healthcheck_routes.js"
import tweetRouter from "./routes/tweet_routes.js"
import subscriptionRouter from "./routes/subscription_routes.js"
import videoRouter from "./routes/video_routes.js"
import commentRouter from "./routes/comment_routes.js"
import likeRouter from "./routes/like_routes.js"
import playlistRouter from "./routes/playlist_routes.js"
import dashboardRouter from "./routes/dashboard_route.js"

//~ routes declartion
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter)
// app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/dashboard", dashboardRouter)

export { app } ;