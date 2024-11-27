import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const likedBy = req.user._id;

  if (!videoId) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = Video.findById(new mongoose.Types.ObjectId(videoId));

  if (!video) {
    throw new ApiError(400, "Invalid video id");
  }

  const isLiked = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(likedBy),
      },
    },
  ]);

  if (isLiked.length === 0) {
    await Like.create({
      video: videoId,
      likedBy,
    });

    res.status(200).json(new ApiResponse(200, {}, "Video Liked Successfully"));
  } else {
    const likeId = isLiked[0]._id;
    await Like.findByIdAndDelete(new mongoose.Types.ObjectId(likeId));

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Video Unliked Successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const likedBy = req.user._id;

  if (!commentId) {
    throw new ApiError(400, "Invalid comment Id");
  }

  const comment = await Comment.findById(
    new mongoose.Types.ObjectId(commentId)
  );

  if (!comment) {
    throw new ApiError(400, "Invalid comment id");
  }

  const isLiked = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(likedBy),
      },
    },
  ]);

  if (isLiked.length === 0) {
    await Like.create({
      comment: commentId,
      likedBy,
    });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment Liked Successfully"));
  } else {
    const likeId = isLiked[0]._id;
    await Like.findByIdAndDelete(new mongoose.Types.ObjectId(likeId));

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment Unliked Successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const likedBy = req.user._id;

  if (!tweetId) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const tweet = await Tweet.findById(new mongoose.Types.ObjectId(tweetId));

  if (!tweet) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const isLiked = await Like.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(likedBy),
      },
    },
  ]);

  if (isLiked.length === 0) {
    await Like.create({
      tweet: tweetId,
      likedBy,
    });

    res.status(200).json(new ApiResponse(200, {}, "Tweet Liked Successfully"));
  } else {
    const likeId = isLiked[0]._id;
    await Like.findByIdAndDelete(new mongoose.Types.ObjectId(likeId));

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet Unliked Successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $match: {
        video: {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              title: 1,
              description: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        likedVideo: 1,

        _id: 0,
      },
    },
  ]);

  if (likedVideos.length === 0) {
    res
      .status(200)
      .json(new ApiResponse(200, {}, "You haven't liked any Video yet"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Videos Fetched Successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
