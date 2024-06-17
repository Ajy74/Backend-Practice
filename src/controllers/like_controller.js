import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes_model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID !");
    }

    try {
        const existingLike = await Like.findOne({ likedBy:req.user?._id, video:videoId });
    
        if(existingLike){
            await Like.findByIdAndDelete(existingLike._id);
    
            return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully!"));
        }
        else{
            const newLike = await Like.create({
                video: videoId,
                likedBy: req.user?._id
            });

                
            return res.status(200).json(new ApiResponse(200, newLike , "Like added successfully!"));
        }
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while toogle video like !")
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment ID !");
    }

    try {
        const existingLike = await Like.findOne({ likedBy:req.user?._id, comment:commentId });
    
        if(existingLike){
            await Like.findByIdAndDelete(existingLike._id);
    
            return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully!"));
        }
        else{
            const newLike = await Like.create({
                comment: commentId,
                likedBy: req.user?._id
            });

                
            return res.status(200).json(new ApiResponse(200, newLike , "Like added successfully!"));
        }
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while toogle comment like !")
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400, "Invalid tweet ID !");
    }

    try {
        const existingLike = await Like.findOne({ likedBy:req.user?._id, tweet:tweetId });
    
        if(existingLike){
            await Like.findByIdAndDelete(existingLike._id);
    
            return res.status(200).json(new ApiResponse(200, {}, "Like removed successfully!"));
        }
        else{
            const newLike = await Like.create({
                tweet: tweetId,
                likedBy: req.user?._id
            });

                
            return res.status(200).json(new ApiResponse(200, newLike , "Like added successfully!"));
        }
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while toogle tweet like !")
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    // // Find liked videos using the Like collection
    // const likedVideoIds = await Like.find({ likedBy: req.user._id }).distinct("video");
    // // Query videos collection to fetch details of liked videos
    // const likedVideos = await Video.find({ _id: { $in: likedVideoIds } });

    const likedVideos = await Like.aggregate(
        [
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user?._id),
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video",
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
                        }
                    ]
                }
            },
            {
                $replaceRoot: {
                    newRoot: { $arrayElemAt: ["$video", 0] }
                }
            }
        ]
    );

    return res.status(200).json(new ApiResponse(200, likedVideos , "Like videos fetched successfully!"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}