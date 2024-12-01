import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.body

    const channel = await User.findById(channelId).select("_id")

    if(!channel){
        throw new ApiError(400, "invalid channel")
    }

    // subscribers, subscribedTo, isSubscribed
    const channelStats = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(channelId)
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo",
          },
        },
        {
          $addFields: {
            subscribersCount: {
              $size: "$subscribers",
            },
            channelsSubscribedToCount: {
              $size: "$subscribedTo",
            },
            isSubscribed: {
              $cond: {
                if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $project: {
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
          },
        },
      ])
    
      if (!channelStats?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    //total videos count

    const channelVideos = await Video.aggregate([
        {
           $lookup : {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "videosCount"
           }
        },
       
    ])

   
    //total likes

    const likesCount = await Video.aggregate([
        {
            $lookup : {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
          $addFields: {
            videoLikesCount: {
              $size: "$videoLikes",
            },
        }
      },
      {
        $group: {
            _id: null, // Group all documents together
            totalLikes: { $sum: "$videoLikesCount" }, // Sum up videoLikesCount
        }
    },
      {
        $project : {
          totalLikes : 1,
          _id: 0
        }
      }
    ])

    
    
    
      res
      .status(200)
      .json( new ApiResponse(200, [channelStats[0], channelVideos?.length, likesCount[0]?.totalLikes], "User Channel Fetched Successfully"))


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId} = req.body

    const channel = await User.findById(channelId).select("_id")

    if(!channel){
        throw new ApiError(400, "invalid channel")
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        }
    ])

    if(videos.length === 0){
        res
        .status(200)
        .json(new ApiResponse(200, {}, "No videos found"))
    }

    res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel Videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }