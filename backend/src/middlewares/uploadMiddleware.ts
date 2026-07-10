import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "connectu_avatars",
      format: "webp",
      transformation: [{ width: 400, height: 400, crop: "fill" }],
    };
  },
});

const resumeStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'connectu_resumes',
            resource_type: 'auto'
        } as any
    },
});

const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'connectu_banners',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    } as any
  },
});

const postStorage = new CloudinaryStorage ({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'connectu_banners',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    } as any
  }
})

const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'connectu_chat',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    } as any
  }
})

export const uploadBanner = multer({ storage: bannerStorage});
export const uploadResume = multer({ storage: resumeStorage});
export const uploadAvatar = multer({ storage: storage });
export const uploadPost = multer ({ storage: postStorage});
export const uploadChatImage = multer({ storage: chatStorage });