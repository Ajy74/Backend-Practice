import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails ,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user_controller.js";
import {upload} from "../middlewares/multer_middleware.js";
import { verifyJWT } from "../middlewares/auth_middleware.js";

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
userRouter.route("/login").post(loginUser)

//~ secured routes
userRouter.route("/logout").post( verifyJWT, logoutUser ) // it will first verify user then logout
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-passowrd").post(verifyJWT, changeCurrentPassword)
userRouter.route("/get-user").post(verifyJWT, getCurrentUser)
userRouter.route("/update-acccount-details").patch(verifyJWT, updateAccountDetails) //* to avoid all details update ..use patch() method
userRouter.route("/update-avatar").patch(
    verifyJWT, 
    upload.single("avatar"),
    updateUserAvatar
)
userRouter.route("/update-cover-image").patch(
    verifyJWT, 
    upload.single("coverImage"),
    updateUserCoverImage
)
userRouter.route("/get-channel-profile/:username").get(verifyJWT, getUserChannelProfile)
userRouter.route("/get-watch-history").get(verifyJWT, getWatchHistory)

export default userRouter; 