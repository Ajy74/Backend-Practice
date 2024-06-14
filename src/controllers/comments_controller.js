import mongoose from "mongoose"
import {Comment} from "../models/comments_model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content, video, owner} = req.body;

    if(
        [content, vedio, owner].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All details are required !")
    }


    if(!mongoose.Types.ObjectId.isValid(vedio) || !mongoose.Types.ObjectId.isValid(owner)){
        throw new ApiError(400, "Invalid ID of Video or User !")
    }
    
    const comment = await Comment.create({
        content,
        video,
        owner
    });

    if(!comment){
        throw new ApiError(500, "Something went wrong while adding comment !");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(201, comment, "Comment added successfully !")
    );

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}