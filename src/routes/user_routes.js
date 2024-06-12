import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user_controller.js";
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

export default userRouter; 