import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments Fetched Successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  const owner = await User.findById(req.user._id).select(
    "avatar fullname username"
  );

  if (!content) {
    throw new ApiError(400, "Comment field is mandatory");
  }
  if (!owner) {
    throw new ApiError(400, "You must be logged in to comment");
  }
  if (!(videoId && mongoose.isValidObjectId(videoId))) {
    throw new ApiError(400, "Invalid Video id");
  }

  const video = await Video.findById(videoId).select(
    "_id title description owner"
  );

  if (!video) {
    throw new ApiError(400, "Invalid Video id");
  }

  const comment = await Comment.create({
    content,
    video,
    owner,
  });

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Added Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { content } = req.body;
  const { commentId } = req.params;

  let commentOwner = await Comment.findById(commentId).select("owner");
  commentOwner = commentOwner.owner.toString();
  const currentUser = req.user._id.toString();

  if (commentOwner !== currentUser) {
    throw new ApiError(400, "You cannot update the comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  let commentOwner = await Comment.findById(commentId).select("owner");

  if (!commentOwner) {
    throw new ApiError(400, "No Such Comment Found ");
  }

  commentOwner = commentOwner.owner.toString();

  const currentUser = req.user._id.toString();

  if (commentOwner !== currentUser) {
    throw new ApiError(400, "You cannot update the comment");
  }

  await Comment.findByIdAndDelete(commentId);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
