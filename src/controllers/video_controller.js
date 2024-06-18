import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/vedio_model.js"
import {User} from "../models/users_model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //~ sortBy is expected to be a string representing the field name by which to sort (e.g., "createdAt", "title").
    //~ query can be as..fun video,comedy..etc

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, "Invalid user ID !");
    }

    const sortOptions = { [sortBy]: sortType === "desc" ? -1 : 1 };
    const matchStage = {
        ...(query ? { title: { $regex: query, $options: "i" } } : {}),
        ...(userId ? { owner: new mongoose.Types.ObjectId(userId) } : {})
    };
    const pipeline = [
        {
            $match: matchStage
        },
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
            $unwind: "$owner"
        },
        {
            $sort: sortOptions
        }
    ];
    const paginateOptions = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const result = await Video.aggregatePaginate(
        Video.aggregate(pipeline), 
        paginateOptions
    );
    
    if(!result){
        throw new ApiError(500, "Something went wrong fetching all videos !");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {
           result
        }, 
        "All videos fetched successfully!"
    ));
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
        
        const thumbnailUploaded = await uploadOnCloudinary(thumbnailFilePath);
        const videoUploaded = await uploadOnCloudinary(videoFilePath);

        // console.log("video docs >>\n",videoUploaded);

        if(!videoUploaded){
            throw new ApiError(500, "Something went wrong while uploading video !");
        }
        if(!thumbnailUploaded){
            throw new ApiError(500, "Something went wrong while uploading thumbnail !");
        }


        const newVideo = await Video.create({
            videoFile: videoUploaded.url,
            thumbnail: thumbnailUploaded.url,
            title,
            description,
            duration: videoUploaded.duration,
            isPublished: true,
            owner: req.user?._id
        });

        if(!newVideo){
            throw new ApiError(500, "Something went wrong while publishing video !");
        }

        return res.status(201).json(
            new ApiResponse(200, newVideo, "Video pulished Succefully")
        );

        // {
        //     "asset_id": "4679d010d6e0ad9932c510bb871b6930",
        //     "public_id": "practice/fkefgqeaaxvztqfy81o8",
        //     "version": 1718625909,
        //     "version_id": "5ef1eed93167719d75f095b74b460130",
        //     "signature": "84de6328257eb7d25734b752dce284cbc93d47ab",
        //     "width": 960,
        //     "height": 540,
        //     "format": "ogv",
        //     "resource_type": "video",
        //     "created_at": "2024-06-17T12:05:09Z",
        //     "tags": [],
        //     "pages": 0,
        //     "bytes": 346695,
        //     "type": "upload",
        //     "etag": "a216dc1ade91fccfb964499b2b95f17a",
        //     "placeholder": false,
        //     "url": "http://res.cloudinary.com/dwhrcr1ms/video/upload/v1718625909/practice/fkefgqeaaxvztqfy81o8.ogv",
        //     "secure_url": "https://res.cloudinary.com/dwhrcr1ms/video/upload/v1718625909/practice/fkefgqeaaxvztqfy81o8.ogv",
        //     "playback_url": "https://res.cloudinary.com/dwhrcr1ms/video/upload/sp_auto/v1718625909/practice/fkefgqeaaxvztqfy81o8.m3u8",
        //     "folder": "practice",
        //     "audio": {},
        //     "video": {
        //         "pix_format": "yuv420p",
        //         "codec": "theora",
        //         "level": -99,
        //         "dar": "16:9",
        //         "time_base": "1001/30000"
        //     },
        //     "frame_rate": 29.97002997002997,
        //     "bit_rate": 207809,
        //     "duration": 13.346667,
        //     "rotation": 0,
        //     "original_filename": "sample_video",
        //     "api_key": "299839624764742"
        // }
    } catch (error) {
        console.log("log error-> ",error);
        throw new ApiError(500, "Something went wrong while uploading video or thumbnail file !");
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID !");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullname: 1
                        }
                    }
                ]
            }
        }
    ]);

    if(!video){
        throw new ApiError(500, "Something went wrong while fetching video !");
    }

    if(video.length < 1){
        throw new ApiError(500, "Video not found !");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video[0], "video fetched sucessfully !")
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title, description} = req.body;
    if(title.trim() === ""){
        throw new ApiError(400, "title is required !");
    }
    if(description.trim() === ""){
        throw new ApiError(400, "description is required !");
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID !");
    }

    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnail file required !");
    }

    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                title,
                description,
                thumbnail: uploadedThumbnail.url
            }
        },
        {new: true}
    );

    if(!video){
        throw new ApiError(500, "Something went wrong while updating video details !");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "video updated sucessfully !")
    );

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID !");
    }

    const video = await Video.findByIdAndDelete(videoId);
    if(!video){
        throw new ApiError(500, "Something went wrong while deleting video !");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "video deleted sucessfully !")
    );

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID !");
    }

    const video = await Video.findById(videoId);
    video.isPublished = !video.isPublished;
    await video.save({validateBeforeSave: false});

    if(!video){
        throw new ApiError(500, "Something went wrong while toggle publish status of video !");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "publish status updated sucessfully !")
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}