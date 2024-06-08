import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/users_model";


export const verifyJWT = asyncHandler(
    // async (req, res, next) => {
    async (req, _, next) => {

        try {
            //~ header will come from mobile applications
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
            if(!token){
                throw new ApiError(401, "Unauthorized request !");
            }
    
            const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
            const user = await User.findById(decodedInfo?._id).select(
                "-password -refreshToken"
            );
    
            if(!user){
                throw new ApiError(401, "Invalid Access Token !");
            }
    
            req.user = user;
            next();
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid access token !");
        }
    }
)