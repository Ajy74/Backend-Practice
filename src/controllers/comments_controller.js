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
    const {videoId} = req.params
    const {content} = req.body;

    if(
        [content, videoId].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All details are required !")
    }

    if( !mongoose.Types.ObjectId.isValid(videoId) ){
        throw new ApiError(400, "Invalid ID of Video !")
    }
    
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
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
    const { commentId, content }  = req.body;

    if(
        [commentId, content].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All details are required !")
    }

    if( !mongoose.Types.ObjectId.isValid(commentId) ){
        throw new ApiError(400, "Invalid comment ID !")
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user?._id },
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found or user is not authorized to update this comment");
    }

    res.status(200).json(200, updateComment, "Comment updated successfully !");

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if( !mongoose.Types.ObjectId.isValid(commentId) ){
        throw new ApiError(400, "Invalid comment ID !")
    }

    const deletedComment = await Comment.findOneAndDelete(
        { _id: commentId, owner: req.user?._id },
        {
            new: true
        }
    );

    if (!deletedComment) {
        throw new ApiError(404, "Comment not found or user is not authorized to delete this comment");
    }

    res.status(200).json(200, {}, "Comment deleted successfully !");
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}