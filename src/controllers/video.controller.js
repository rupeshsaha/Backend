import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,         // Default to page 1
    limit = 10,       // Default to 10 items per page
    query,            // Search query
    sortBy = "createdAt", // Default sort field
    sortType = "desc", // Default sort direction
    userId            // Optional filter for user-specific videos
  } = req.query;

  // Convert page and limit to numbers
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // Build the search filter
  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" }; // Case-insensitive regex search on title
  }
 

  // Calculate sorting order
  const sortOrder = sortType === "asc" ? 1 : -1;

  // Fetch videos with filters, pagination, and sorting
  const videos = await Video.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip((pageNum - 1) * limitNum) // Skip documents for pagination
    .limit(limitNum); // Limit number of documents per page

  // Count total documents matching the filter
  const totalVideos = await Video.countDocuments(filter);

  // Calculate total pages
  const totalPages = Math.ceil(totalVideos / limitNum);

  // Return paginated response
  res.status(200).json(new ApiResponse(200,{
    success: true,
    data: videos,
    pagination: {
      totalVideos,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    },
  },"Videos Fetched Successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if(!title){
    throw new ApiError(400, "Title is required")
  }

  if(!description){
    throw new ApiError(400, "Description is required")
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Error while uploading Video file");
  }
  if (!thumbnail) {
    throw new ApiError(400, "Error while Thumbnail file");
  }

  const owner = await User.findById(req.user._id).select(
    "_id avatar username fullname"
  );

  const { duration } = videoFile;

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration,
    owner,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        video,
      },
      "Video Uploaded Successfully"
    )
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id



  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id")
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id : new mongoose.Types.ObjectId(videoId)
      }
    },
          {
            $lookup : {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline : [
                {
                  $project : {
                    fullname : 1,
                    username : 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields : {
              owner : {
                $first: "$owner"
              }
            }
          }
        ]
  )
    

 
  if(!video){
throw new ApiError(400, "Invalid Video id")
  }
  

  
  res.status(200).json(new ApiResponse(200, video[0], "Video successfully fetched by its Id"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail


 
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    } 
    
    const video = await Video.findById(videoId)
    
     const {title, description} = req.body
  const thumbnailLocalPath = req.file?.path
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  

    if(req.user._id.toString() !== video.owner.toString()){
        throw new ApiError(400, "You are not the owner of the video.")
    }



  if(!(title || description || thumbnailLocalPath)){
    throw new ApiError(400, "Atleast one field is required to update")
  }
    

    await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                title,
                description,
                thumbnail: thumbnail?.url
               
            }
        },{
            new: true
        }
    )

    res
    .status(200)
    .json(new ApiResponse(200,"Video details Updated Successfully"))



});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video Id")
} 

const video = await Video.findById(videoId)

if(req.user._id.toString() !== video.owner.toString()){
    throw new ApiError(400, "You are not the owner of the video.")
}

await Video.findByIdAndDelete(videoId)

res
.status(200)
.json(new ApiResponse(200, "Video Deleted Successfully."))
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid Video")
  }

  let video = await Video.findById(videoId);

  if(req.user._id.toString() !== video.owner.toString()){
    throw new ApiError(400, "You are not the owner of the video.")
}

  video = await Video.findById(videoId).select("isPublished");

  if (!video) {
      throw new ApiError(404, "Video not found");
  }

 
  
  // Toggle the value
  video.isPublished = !video.isPublished;
  
  // Save the updated document
  await video.save();
  
  console.log("Toggled isPublished:", video.isPublished);
  


  res
  .status(200)
  .json(new ApiResponse(200,video.isPublished,"Publish Status Toggled Successfully"))
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
