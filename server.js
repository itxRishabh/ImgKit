const express = require('express');
const cors = require('cors');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (including localhost and Vercel)
app.use(cors({
    origin: '*',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// Accept raw binary bodies up to 250MB
app.use(express.raw({
    type: 'image/*',
    limit: '250mb'
}));
app.use(express.raw({
    type: 'application/octet-stream',
    limit: '250mb'
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// HEIC conversion API
app.post('/api/convert-heic', async (req, res) => {
    try {
        const buffer = req.body;

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ error: 'No file data received.' });
        }

        const format = req.query.format || 'jpeg';
        const quality = parseInt(req.query.quality) || 90;
        const maxDim = parseInt(req.query.maxDim) || 4096;

        let pipeline = sharp(buffer, { failOn: 'none', limitInputPixels: 268402689 });

        // Get metadata
        const metadata = await pipeline.metadata();

        // Auto-rotate based on EXIF orientation
        pipeline = pipeline.rotate();

        // Downscale if larger than maxDim
        if (metadata.width > maxDim || metadata.height > maxDim) {
            pipeline = pipeline.resize(maxDim, maxDim, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Convert to requested format
        let outputBuffer;
        let outputMime;

        switch (format) {
            case 'png':
                outputBuffer = await pipeline.png({ compressionLevel: 6 }).toBuffer();
                outputMime = 'image/png';
                break;
            case 'webp':
                outputBuffer = await pipeline.webp({ quality }).toBuffer();
                outputMime = 'image/webp';
                break;
            case 'avif':
                outputBuffer = await pipeline.avif({ quality }).toBuffer();
                outputMime = 'image/avif';
                break;
            default: // jpeg
                outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
                outputMime = 'image/jpeg';
                break;
        }

        // Get output dimensions
        const outputMeta = await sharp(outputBuffer).metadata();

        // Send the converted image with headers
        res.setHeader('Content-Type', outputMime);
        res.setHeader('Content-Length', outputBuffer.length);
        res.setHeader('X-Original-Width', metadata.width || 0);
        res.setHeader('X-Original-Height', metadata.height || 0);
        res.setHeader('X-Output-Width', outputMeta.width || 0);
        res.setHeader('X-Output-Height', outputMeta.height || 0);
        res.setHeader('X-Original-Format', metadata.format || 'unknown');

        return res.status(200).send(outputBuffer);
    } catch (error) {
        console.error('HEIC conversion error:', error);
        return res.status(500).json({
            error: 'Conversion failed',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`HEIC Conversion Server running on port ${PORT}`);
});
