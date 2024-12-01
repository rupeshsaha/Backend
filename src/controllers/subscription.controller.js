import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  const subscriber = await User.findById(req.user._id).select("_id");
  const channel = await User.findById(channelId).select("_id")

  if(!subscriber || !channel){
    throw new ApiError(400, "no such channel or user exists")
  }

  const isAlreadySubscribed = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriber),
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ]);

  if (isAlreadySubscribed.length === 0) {
    const subscription = await Subscription.create({
      channel: channelId,
      subscriber,
    });

    if(!subscription){
      throw new ApiError(400, "Error occurred while subscribing")
    }

    res
      .status(200)
      .json(new ApiResponse(200, subscription, "Subscribed Successfully"));
  } else {
   const unsubscribe = await Subscription.findByIdAndDelete(isAlreadySubscribed)


   if(!unsubscribe){
    throw new ApiError(400, "Error occurred while unsubscribing")
   }
    res
    .status(200)
    .json(new ApiResponse(200, {}, "Unsubscribed Successfully"))
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const channel = await User.findById(channelId).select("_id")

  if(!channel){
    throw new ApiError(200, "No such channel found")
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $project: {
        subscriber: 1,
        _id: 0
      }
    }
  ])

  if(!subscribers){
    res.json(new ApiResponse(200,{},"No subscribers found"))
  }
  
  res
.status(200)
.json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
});



// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscriber = await User.findById(subscriberId).select("_id")

  if(!subscriber){
    throw new ApiError(400, "No such channel found")
  }

  const subscribedTo = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId)
      }
    },
    {
      $project: {
        subscriber: 1,
        _id: 0
      }
    }
  ])

  res
  .status(200)
  .json(new ApiResponse(200, subscribedTo, "SubscribedTo fetched successfully"))
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
