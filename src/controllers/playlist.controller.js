import mongoose, {isValidObjectId, mongo} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!(name && description)){
        throw new ApiError(400, "All fields are required")
    }

    const playlist =await Playlist.create(
        {
            name,
            description,
            owner: req.user._id
        }
    )

    if(!playlist){
        throw new ApiError(500, "Error While Creating Playlist")
    }

    res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Created Successfully"))

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    const user = await User.findById(userId).select("_id")

    if(!user){
        throw new ApiError(400, "No Such user found")
    }

    const playlists = await Playlist.aggregate([
        {
            $match:{
              owner: new mongoose.Types.ObjectId(userId)
            } 
        }
    ])

    if(!playlists){
        throw new ApiResponse(200, {}, "No Playlist Found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    const playlist = await Playlist.findById(playlistId).select("name description videos owner")

    if(!playlist){
        throw new ApiError(400, "No Such Playlist Found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched Successfully"))


    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "No such playlist found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "No such video found")
    }

   const updatedPlaylist = await Playlist.updateOne(
    {
        _id: new mongoose.Types.ObjectId(playlistId)
    },
    {
         $push : {videos: videoId}
    },
   )

    res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video Added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "No such playlist found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "No such video found")
    }

    const updatedPlaylist = await Playlist.updateOne(
        {
            _id: new mongoose.Types.ObjectId(playlistId)
        },
        {
             $pull : {videos: videoId}
        },
       )
    
        res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    const deletedPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $project : {
                _id: 1
            }
        }
    ])

    if(deletedPlaylist.length !== 0){
    const playlist =  await Playlist.findByIdAndDelete(playlistId);
        res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist deleted successfully"))
    } else {
        throw new ApiError(400, "Error while deleting the playlist")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

 try {
       const updatedPlaylist = await Playlist.aggregate([
           {
               $match : {
                   _id: new mongoose.Types.ObjectId(playlistId)
               }
           },
           {
               $match: {
                   owner: new mongoose.Types.ObjectId(req.user._id)
               }
           },
           {
               $set : {
                   name,
                   description,
               }
           },
           {
               $project: {
                   name: 1,
                   description: 1
               }
           }
       ])
 } catch (error) {
    throw new ApiError(400, "Error while updating playlist")
 }

    res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated Successfully"))
    //TODO: update playlist
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