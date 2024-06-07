import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/users_model.js";
import {uploadOnCloudinary} from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    });

    if(existedUser){
        throw new ApiError(409, "user with email or username already exists !");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required !");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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



export {registerUser} 