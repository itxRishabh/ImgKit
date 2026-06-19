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

// SEO Audit Proxy (local dev)
app.get('/api/seo-audit', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'Missing ?url= parameter.' });

    let parsedUrl;
    try {
        parsedUrl = new URL(targetUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Bad protocol');
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL.' });
    }

    const origin = parsedUrl.origin;
    const startTime = Date.now();

    try {
        const fetchOpts = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ImgKitSEOAudit/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            redirect: 'follow',
        };

        const [pageRes, robotsRes, sitemapRes] = await Promise.allSettled([
            fetch(targetUrl, fetchOpts),
            fetch(`${origin}/robots.txt`, fetchOpts).catch(() => null),
            fetch(`${origin}/sitemap.xml`, fetchOpts).catch(() => null),
        ]);

        if (pageRes.status === 'rejected') {
            return res.status(502).json({ error: 'Failed to fetch URL.', message: pageRes.reason?.message });
        }

        const page = pageRes.value;
        const html = await page.text();
        const headers = {};
        page.headers.forEach((value, key) => { headers[key] = value; });

        let robotsTxt = null;
        if (robotsRes.status === 'fulfilled' && robotsRes.value && robotsRes.value.ok) {
            robotsTxt = await robotsRes.value.text();
        }

        let sitemapExists = false;
        if (sitemapRes.status === 'fulfilled' && sitemapRes.value && sitemapRes.value.ok) {
            const st = await sitemapRes.value.text();
            sitemapExists = st.includes('<urlset') || st.includes('<sitemapindex');
        }

        return res.json({
            url: targetUrl, finalUrl: page.url, statusCode: page.status,
            headers, html, robotsTxt, sitemapExists,
            isHttps: parsedUrl.protocol === 'https:',
            responseTimeMs: Date.now() - startTime,
            pageSize: html.length,
        });
    } catch (error) {
        console.error('[SEO Audit] Error:', error);
        return res.status(500).json({ error: 'Audit failed', message: error.message });
    }
});

// Server-side video conversion endpoint using static FFmpeg binary
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const crypto = require('crypto');

app.post('/api/convert-video', async (req, res) => {
    let inputPath = null;
    let outputPath = null;
    try {
        const buffer = req.body;
        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ error: 'No video data received.' });
        }

        const format = req.query.format || 'mp4';
        const crf = req.query.crf || '23';
        const scale = parseFloat(req.query.scale) || 1.0;
        const keepAudio = req.query.audio === 'true';

        console.log(`[Video Server] Received ${(buffer.length / 1024 / 1024).toFixed(2)} MB video. Format: ${format}, CRF: ${crf}, Scale: ${scale}`);

        // Create temporary paths
        const id = crypto.randomBytes(8).toString('hex');
        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        inputPath = path.join(tmpDir, `input_${id}`);
        outputPath = path.join(tmpDir, `output_${id}.${format}`);

        // Write input video to disk
        fs.writeFileSync(inputPath, buffer);

        // Build FFmpeg arguments
        const args = ['-i', inputPath];

        // Resolution filter
        const vf = [];
        if (scale !== 1) {
            vf.push(`scale=trunc(iw*${scale}/2)*2:trunc(ih*${scale}/2)*2`);
        }
        if (format === 'gif') {
            vf.push('fps=12');
        }
        if (vf.length > 0) {
            args.push('-vf', vf.join(','));
        }

        // Audio track
        if (!keepAudio || format === 'gif') {
            args.push('-an');
        } else {
            args.push('-c:a', 'aac');
        }

        // Encoder / Preset
        if (format === 'mp4') {
            args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', crf);
        } else if (format === 'webm') {
            let webmCrf = '20';
            if (crf === '18') webmCrf = '10';
            if (crf === '28') webmCrf = '32';
            if (crf === '32') webmCrf = '45';
            args.push('-c:v', 'libvpx', '-crf', webmCrf, '-b:v', '0');
        } else if (format === 'mkv') {
            args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', crf);
        }

        args.push('-y', outputPath);

        console.log(`[Video Server] Running: ${ffmpegPath} ${args.join(' ')}`);

        // Run FFmpeg CLI using execFile
        execFile(ffmpegPath, args, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                console.error('[Video Server] FFmpeg Error:', error, stderr);
                cleanup();
                return res.status(500).json({ error: 'FFmpeg processing failed', details: error.message });
            }

            if (!fs.existsSync(outputPath)) {
                cleanup();
                return res.status(500).json({ error: 'Output file was not generated.' });
            }

            // Read output file
            const outputBuffer = fs.readFileSync(outputPath);
            console.log(`[Video Server] Successfully converted video. Output size: ${(outputBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            const mimeTypes = {
                mp4: 'video/mp4',
                webm: 'video/webm',
                gif: 'image/gif',
                mkv: 'video/x-matroska'
            };

            res.setHeader('Content-Type', mimeTypes[format] || 'video/mp4');
            res.setHeader('Content-Length', outputBuffer.length);
            
            res.status(200).send(outputBuffer);
            cleanup();
        });

    } catch (err) {
        console.error('[Video Server] Route Error:', err);
        cleanup();
        res.status(500).json({ error: 'Server conversion error', message: err.message });
    }

    function cleanup() {
        try {
            if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {
            console.warn('[Video Server] Cleanup error:', e.message);
        }
    }
});

app.listen(PORT, () => {
    console.log(`ImgKit Server running on port ${PORT}`);
    // Pre-warm the BG removal model in background
    ensureBgRemoval().catch(err => console.warn('[BG Removal] Pre-warm failed:', err.message));
});

