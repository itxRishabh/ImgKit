const sharp = require('sharp');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        // Read the raw body as a Buffer
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        if (buffer.length === 0) {
            return res.status(400).json({ error: 'No file data received.' });
        }

        // Get query parameters for output format and quality
        const format = req.query.format || 'jpeg';
        const quality = parseInt(req.query.quality) || 90;
        const maxDim = parseInt(req.query.maxDim) || 4096;

        // Process with sharp — handles HEIC, AVIF, TIFF, RAW, and all other formats
        let pipeline = sharp(buffer, { failOn: 'none', limitInputPixels: 268402689 });

        // Get metadata first
        const metadata = await pipeline.metadata();

        // Auto-rotate based on EXIF orientation
        pipeline = pipeline.rotate();

        // Downscale if larger than maxDim (to keep output manageable)
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

        // Get output metadata for dimensions
        const outputMeta = await sharp(outputBuffer).metadata();

        // Send the converted image
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
};

// Disable Vercel's default body parser so we can read the raw binary
module.exports.config = {
    api: {
        bodyParser: false,
        responseLimit: '50mb'
    }
};
