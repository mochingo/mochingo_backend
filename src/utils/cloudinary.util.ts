import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (buffer: Buffer, folder: string = 'mochingo/pet_profiles'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return reject(new Error('Failed to upload image to Cloudinary'));
                }
                if (result && result.secure_url) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('No URL returned from Cloudinary'));
                }
            }
        );
        uploadStream.end(buffer);
    });
};

export default cloudinary;
