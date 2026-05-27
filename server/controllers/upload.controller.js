import cloudinary from '../config/cloudinary.js'
import Asset from '../models/asset.model.js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file provided' })

        const { mimetype, originalname, buffer, size } = req.file

        if (!ALLOWED_TYPES.includes(mimetype)) {
            return res.status(400).json({ message: 'Only JPEG, PNG, WebP, GIF and SVG files are allowed' })
        }
        if (size > MAX_BYTES) {
            return res.status(400).json({ message: 'File size must be under 5 MB' })
        }

        const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`
        const result = await cloudinary.uploader.upload(base64, {
            folder: `genweb/${req.user._id}`,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
        })

        const asset = await Asset.create({
            userId: req.user._id,
            url: result.secure_url,
            publicId: result.public_id,
            name: originalname,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
        })

        return res.status(201).json({
            url: asset.url,
            publicId: asset.publicId,
            name: asset.name,
            format: asset.format,
            width: asset.width,
            height: asset.height,
            id: asset._id,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return res.status(500).json({ message: 'Upload failed. Please try again.' })
    }
}

export const getUserAssets = async (req, res) => {
    try {
        const assets = await Asset.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(100)
        return res.status(200).json(assets)
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch assets' })
    }
}

export const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id })
        if (!asset) return res.status(404).json({ message: 'Asset not found' })

        await cloudinary.uploader.destroy(asset.publicId)
        await asset.deleteOne()

        return res.status(200).json({ message: 'Deleted' })
    } catch (error) {
        return res.status(500).json({ message: 'Delete failed' })
    }
}
