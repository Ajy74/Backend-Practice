import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/users_model.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { json } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



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
                $unset: {
                    refreshToken: 1 //~ this remove the field from document
                }
            },
            {
                new: true
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


const changeCurrentPassword = asyncHandler(
    async (req, res) => {
        const {oldPassword, newPassword} = req.body

        const user = await User.findById(req._id);

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if(!isPasswordCorrect){
            throw new ApiError(400, "Invalid password !")
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false});

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password change successfully !")
        )
    }
);


const getCurrentUser = asyncHandler(
    async (req, res) => {
        return res
        .status(200)
        .json(
            200,
            req.user,
            "current user fetched succesfully !"
        );
    }
);

const updateAccountDetails = asyncHandler(
    async (req, res) => {
        const {fullname, email } = req.body;

        if(!fullname || !email){
            throw ApiError(400, "All fields are required !")
        }

        //~ by using new:true ...updated data will return
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullname,
                    email
                }
            },
            {new: true}
        ).select("-password");

        return res
        .status(200)
        .json(new ApiResponse(200, user, "details updated successfully !")) ;
    }
);

const updateUserAvatar = asyncHandler(
    async (req, res) => {
        const avatarLocalPath = req.file?.path
        if(!avatarLocalPath){
           throw new ApiError(400, "Avatar file is missing !");
        }

        //TODO:- get previous avatar url details
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if(!avatar.url){
            throw new ApiError(400, "Error while uploading on avatar !");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar: avatar.url
                }
            },
            {new: true}
        ).select("-password");

        //TODO:- delete previous file from cloudanary after changes 

        return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully !")) ;
    }
);

const updateUserCoverImage = asyncHandler(
    async (req, res) => {
        const coverImgLocalPath = req.file?.path
        if(!coverImgLocalPath){
           throw new ApiError(400, "Cover Image file is missing !");
        }

        //TODO:- get previous avatar url details
        const coverImg = await uploadOnCloudinary(coverImgLocalPath);
        if(!coverImg.url){
            throw new ApiError(400, "Error while uploading on cover image !");
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage: coverImg.url
                }
            },
            {new: true}
        ).select("-password");

        //TODO:- delete previous file from cloudanary after changes 

        return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully !")) ;
    }
);

const getUserChannelProfile = asyncHandler(
    async (req, res) => {
        const { username } = req.params;
        if(!username?.trim()){
            throw new ApiError(400, "username missing !");
        }

        //~ let's use aggregation pipeline here
        const channel = await User.aggregate(
            [
                {
                    $match: {
                        username: username?.toLowerCase()
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "channel",
                        as: "subscribers"
                    },
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "subscriber",
                        as: "subscribedTo"
                    },
                },
                {
                    $addFields: {
                        subscribersCount : {
                            $size: "$subscribers"
                        },
                        channelsSubscribedToCount: {
                            $size: "$subscribedTo"
                        },
                        isSubscribed: {
                            $cond: {
                                if: {
                                    $in: [req.user?._id, "$subscribers.subscriber"]
                                },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        fullname: 1,
                        username: 1,
                        subscribersCount: 1,
                        channelsSubscribedToCount: 1,
                        isSubscribed: 1,
                        avatar: 1,
                        coverImage: 1,
                        email: 1
                    }
                }
            ]
        );

        if(!channel?.length){
            throw new ApiError(404, "channel does not exists !");
        }

        console.log("channel aggreation docs:--> \n",channel);

        return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "channel details fetched successfully !")
        );
    }
);


const getWatchHistory = asyncHandler(
    async (req, res) => {
        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        if(!user?.length){
            throw new ApiError(404, "user does not exists !");
        }

        console.log("user watch history aggreation docs:--> \n",channel);

        return res
        .status(200)
        .json(
            new ApiResponse(200, user[0], "user watch history details fetched successfully !")
        );
    }
);


export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} 