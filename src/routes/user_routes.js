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
    updateUserCoverImage
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
userRouter.route("/update-acccount-details").post(verifyJWT, updateAccountDetails)
userRouter.route("/update-avatar").post(
    verifyJWT, 
    upload.single("avatar"),
    updateUserAvatar
)
userRouter.route("/update-cover-image").post(
    verifyJWT, 
    upload.single("coverImage"),
    updateUserCoverImage
)

export default userRouter; 