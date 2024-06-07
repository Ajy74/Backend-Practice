import { Router } from "express";
import { registerUser } from "../controllers/user_controller.js";
import {upload} from "../middlewares/multer_middleware.js";

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
// userRouter.route("/register").post(registerUser)

export default userRouter; 