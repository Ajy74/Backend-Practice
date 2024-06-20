import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription_controller.js"
import {verifyJWT} from "../middlewares/auth_middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/channnel/:channelId").get(getSubscribedChannels);
router.route("/subsribe/:channelId").post(toggleSubscription);

router.route("/user/:subscriberId").get(getUserChannelSubscribers);

export default router