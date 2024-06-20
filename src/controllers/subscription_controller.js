import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/users_model.js"
import { Subscription } from "../models/subscription_model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }

    try {
        const existingSubscription = await Subscription.findOne(
            {
                $channel: channelId,
                $subscriber: req.user?._id
            }
        );

        if(existingSubscription){
            await Subscription.findByIdAndDelete(existingSubscription._id);
            return res.status(200).json(new ApiResponse(200, {}, "subscription removed successfully!"));
        }
        else{
            const newSubscribe = await Subscription.create({
                subscriber: req.user?._id,
                channel: channelId
            });

                
            return res.status(200).json(new ApiResponse(200, newSubscribe , "Subcription added successfully!"));
        }
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while toogle subscription !")
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "subscriber"
            }
        },
        {
            $project: {
                subscriber: 1
            }
        }
    ]);

    if(!subscriberList){
        throw new ApiError(500, "Something went wrong fetching subscriber list !")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscriberList[0], "subscriber list fetched successfully !")
    );

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "channel"
            }
        },
        {
            $project: {
                channel: 1
            }
        }
    ]);

    if(!channelList){
        throw new ApiError(500, "Something went wrong fetching channel list !")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channelList[0], "channel list fetched successfully !")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}