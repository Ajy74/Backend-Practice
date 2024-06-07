import { Router } from "express";
import { registerUser } from "../controllers/user_controller.js";

const userRouter = Router()

userRouter.route("/register").post(registerUser)
// userRouter.route("/register").post(registerUser)

export default userRouter; 