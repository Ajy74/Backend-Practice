import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like_controller.js"
import {verifyJWT} from "../middlewares/auth_middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/video-like/:videoId").post(toggleVideoLike);
router.route("/toggle/comment-like/:commentId").post(toggleCommentLike);
router.route("/toggle/tweet-like/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router