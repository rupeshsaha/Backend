import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "All fields are required")
    }

    const owner = await User.findById(req.user._id).select("_id")

    const tweet = await Tweet.create({
        owner,
        content
    })

    res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(401, "Invalid User Id")
    }
    

    const tweets =await Tweet.aggregate([
        {
            $match : {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched Successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    let {content} = req.body
    
    

    const tweet = await Tweet.aggregate([
        {
            $match : {
                _id :new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $match : {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        }
    ])

    console.log(tweet);
    

    if(tweet.length === 0){
        throw new ApiError(402, "You cannot update this tweet")
    }


    

   const updatedTweet =  await Tweet.findByIdAndUpdate(tweetId,{
        content
    },{
        new: true
    })

res
.status(200)
.json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
    

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    const tweet = await Tweet.aggregate([
        {
            $match : {
                _id: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $match : {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        }
    ])

    if(tweet.length === 0){
        throw new ApiError(400, "You cannot delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Deleted Successfully"))
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}