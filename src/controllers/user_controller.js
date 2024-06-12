import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/users_model.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { json } from "express";
import jwt from "jsonwebtoken";



const generateAccessAndRefreshTokens =  async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); //~ this not validate required fields

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token !");
    }
}

const registerUser = asyncHandler(
   //* get user details
   //* validation - not empty
   //* check if user already exist: user, email
   //* check for images, check for avatar
   //* upload them to cloudinary, avatar
   //* create user object - create entry in db
   //* remove password and refresh token field from response
   //* check for user creation
   //* return response

   async (req, res) =>{
        const {username, email, fullname, password} = req.body;
        
        // if(fullname == ""){
        //     throw new ApiError(400, "fullname is required")
        // }

        if(
            [fullname, email, username, password].some((field) => field?.trim() === "")
        ){
            throw new ApiError(400, "All fields are required")
        }

        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if(existedUser){
            throw new ApiError(409, "user with email or username already exists !");
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        //~ check for cover image ...user send or not
        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path ;
        }

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is required !");
        }

        // console.log("avatarLocalPath->> ",avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        // console.log("avatar->> ",avatar);
        // console.log("coverImage->> ",coverImage);

        if(!avatar){
            throw new ApiError(500, "Something went wrong while uploading avatar !");
        }

        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        });

        //~ it will check user is creted or not && remove password,refreshToken 
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering user !");
        }


        return res.status(201).json(
            new ApiResponse(200, createdUser, "User Registered Succefully")
        );
   }
)


const loginUser = asyncHandler(
    async (req, res) => {
        //~ req body -> data
        //~ username or email
        //~ find the user
        //~ password check
        //~ access and refresh token 
        //~ send cookie

        const {email, username, password} = req.body;
        
        if( !(username || email) ){
            throw new ApiError(400, "username or email is required !");
        }

        const userExist = await User.findOne({
            $or: [ {username}, {email} ]
        })

        if(!userExist){
            throw new ApiError(404, "User does not exist !");
        }

        //* note-> we can't access method created by own directly using model(User)
        const isPasswordValid = await userExist.isPasswordCorrect(password);
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid user credentials !");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userExist._id);       
        
        const loggedInUser = await User.findById(userExist._id).select(
            "-password -refreshToken"
        );
        
        //~ due to httpOnly:true ..cookie will modify via server ..can only read from frontend
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in succesfully"
            )
        );

    }
)



const logoutUser = asyncHandler(
    async (req, res) => {
        //~ clear cookie
        //~ remove refresh token
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            }
        );

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out !"));
        
    }
)


const refreshAccessToken = asyncHandler(
    async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken){
            throw new ApiError(401, "Unauthorized request !")
        }

        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            );
    
            const user = await User.findById(decodedToken?._id);
            if(!user){
                throw new ApiError(401, "Invalid refresh token !")
            }
    
            //~ now matching incomingtoken with databse stored refreshtoken
            if(incomingRefreshToken !== user?.refreshToken){
                throw new ApiError(401, "Refresh token is expired or used !")
            }
    
            const options = {
                httpOnly: true,
                secure: true
            }
    
            const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user?._id);

            // console.log(`${user._id}\n\n${newAccessToken}\n\n${newRefreshToken}`)
    
            return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {   user,
                        newAccessToken,
                        newRefreshToken
                    },
                    "Access token refreshed !"
                )
            );
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token !")
        }

    }
);


export {registerUser, loginUser, logoutUser, refreshAccessToken} 