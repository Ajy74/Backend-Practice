import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist_model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    if(
        [name, description].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const newPlayList = await Playlist.create({
        name,
        description,
        owner: mongoose.Types.ObjectId(req.user?._id)
    });

    if(!newPlayList){
        throw new ApiError(500, "Something went wrong while creating playlist !")
    }

    return res.status(201).json(
        new ApiResponse(200, newPlayList, "Playlist created succefully !")
    );

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID !")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
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
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
    ]);
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID !")
    }
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video ID !")
    }

    const playlist = await Playlist.findOne(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found !")
    }

    playlist.videos.push(mongoose.Types.ObjectId.isValid(videoId));
    await playlist.save({validateBeforeSave: false});

    return res.status(200).json(
        new ApiResponse(200, {}, "video added to playlist succefully !")
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID !")
    }
    
    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found !")
    }

    
    return res.status(200).json(
        new ApiResponse(200, {}, "playlist deleted succefully !")
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400, "Invalid playlist ID !")
    }

    if(name.trim() === ""){
        throw new ApiError(400, "name field required !")
    }
    if(description.trim() === ""){
        throw new ApiError(400, "description field required !")
    }
 
    const playlist = await Playlist.findOne(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found !")
    }

    playlist.name = name;
    playlist.description = description;
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist updated succefully !")
    );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}