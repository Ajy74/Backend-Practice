import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/vedio_model.js"
import {User} from "../models/users_model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    const videoFilePath = req.files?.videoFile[0]?.path
    const thumbnailFilePath = req.files?.thumbnail[0]?.path

    if(!videoFilePath){
        throw new ApiError(400, "Video file is missing !");
    }
    if(!thumbnailFilePath){
        throw new ApiError(400, "Thumbnail file is missing !");
    }

    if(title.trim() === ""){
        throw new ApiError(400, "Title is required !");
    }
    if(description.trim() === ""){
        throw new ApiError(400, "Description is required !");
    }


    try {
        const videoUploaded = await uploadOnCloudinary(videoFilePath);
        const thumbnailUploaded = await uploadOnCloudinary(thumbnailFilePath);

        console.log("video docs >>\n",videoUploaded);

        if(!videoUploaded){
            throw new ApiError(500, "Something went wrong while uploading video !");
        }
        if(!thumbnailUploaded){
            throw new ApiError(500, "Something went wrong while uploading thumbnail !");
        }


        // const newVideo = await Video.create({
        //     videoFile: videoUploaded.url,
        //     thumbnail: thumbnailUploaded.url,
        //     title,
        //     description,
        //     duration: videoUploaded.duration,
        //     isPublished: true,
        //     owner: mongoose.Types.ObjectId(req.user?._id)
        // });

        // if(!newVideo){
        //     throw new ApiError(500, "Something went wrong while publishing video !");
        // }

        return res.status(201).json(
            new ApiResponse(200, videoUploaded, "Video pulished Succefully")
        );
    } catch (error) {
        throw new ApiError(500, "Something went wrong while uploading video or thumbnail file !");
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}