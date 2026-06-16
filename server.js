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

// Serve static files from the project root directory
app.use(express.static(__dirname));

// Accept raw binary bodies up to 1000MB (1GB)
app.use(express.raw({
    type: 'image/*',
    limit: '1000mb'
}));
app.use(express.raw({
    type: 'application/octet-stream',
    limit: '1000mb'
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Background removal state
let bgRemovalReady = false;
let removeBackgroundFn = null;

async function ensureBgRemoval() {
    if (removeBackgroundFn) return removeBackgroundFn;
    console.log('[BG Removal] Loading @imgly/background-removal-node...');
    const bgModule = await import('@imgly/background-removal-node');
    removeBackgroundFn = bgModule.removeBackground || bgModule.default;
    bgRemovalReady = true;
    console.log('[BG Removal] Model ready.');
    return removeBackgroundFn;
}

// Background removal API
app.post('/api/remove-bg', async (req, res) => {
    try {
        const buffer = req.body;

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ error: 'No image data received.' });
        }

        console.log(`[BG Removal] Processing ${(buffer.length / 1024 / 1024).toFixed(2)} MB image...`);
        const startTime = Date.now();

        // Ensure the AI model is loaded
        const removeBg = await ensureBgRemoval();

        // Resize large images for performance (max 2048px on longest side)
        let inputBuffer = buffer;
        const metadata = await sharp(buffer, { failOn: 'none' }).metadata();
        const maxDim = 2048;
        if (metadata.width > maxDim || metadata.height > maxDim) {
            inputBuffer = await sharp(buffer, { failOn: 'none' })
                .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
                .png()
                .toBuffer();
            console.log(`[BG Removal] Resized from ${metadata.width}x${metadata.height} to fit ${maxDim}px`);
        }

        // Convert buffer to Blob for the library
        const inputBlob = new Blob([inputBuffer], { type: 'image/png' });

        // Run AI background removal
        const resultBlob = await removeBg(inputBlob, {
            model: 'medium',
            output: {
                format: 'image/png',
                quality: 1.0
            }
        });

        // Convert Blob back to Buffer
        const arrayBuffer = await resultBlob.arrayBuffer();
        const resultBuffer = Buffer.from(arrayBuffer);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[BG Removal] Done in ${elapsed}s, output: ${(resultBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        // Send the transparent PNG back
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', resultBuffer.length);
        res.setHeader('X-Processing-Time', elapsed);
        res.setHeader('X-Original-Width', metadata.width || 0);
        res.setHeader('X-Original-Height', metadata.height || 0);

        return res.status(200).send(resultBuffer);
    } catch (error) {
        console.error('[BG Removal] Error:', error);
        return res.status(500).json({
            error: 'Background removal failed',
            message: error.message
        });
    }
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
    console.log(`ImgKit Server running on port ${PORT}`);
    // Pre-warm the BG removal model in background
    ensureBgRemoval().catch(err => console.warn('[BG Removal] Pre-warm failed:', err.message));
});

