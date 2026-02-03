/**
 * ImgKit - All-in-One Image Toolkit
 * Converts images to 1:1 aspect ratio by extending canvas
 */

class ImageSquare {
    constructor() {
        this.images = [];
        this.settings = {
            bgType: 'color',
            bgColor: '#FFFFFF',
            format: 'png',
            quality: 1,
            blendFeather: 30,
            sizeType: 'auto',
            customWidth: 1000,
            customHeight: 1000,
            linkDimensions: false
        };
        this.stats = {
            total: 0,
            success: 0,
            totalTime: 0
        };

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');

        // Settings elements
        this.settingsPanel = document.getElementById('settingsPanel');
        this.bgTypeToggle = document.getElementById('bgTypeToggle');
        this.colorSetting = document.getElementById('colorSetting');
        this.formatToggle = document.getElementById('formatToggle');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.customColor = document.getElementById('customColor');
        this.qualitySetting = document.getElementById('qualitySetting');

        // Smart Extend settings
        this.smartSettings = document.getElementById('smartSettings');
        this.blendFeatherSlider = document.getElementById('blendFeatherSlider');
        this.blendFeatherValue = document.getElementById('blendFeatherValue');

        // Custom Size settings
        this.sizeTypeToggle = document.getElementById('sizeTypeToggle');
        this.customSizeSettings = document.getElementById('customSizeSettings');
        this.customWidthInput = document.getElementById('customWidth');
        this.customHeightInput = document.getElementById('customHeight');
        this.linkDimensionsBtn = document.getElementById('linkDimensions');

        // Preview elements
        this.previewSection = document.getElementById('previewSection');
        this.previewGrid = document.getElementById('previewGrid');
        this.clearAllBtn = document.getElementById('clearAll');
        this.downloadAllBtn = document.getElementById('downloadAll');

        // Stats elements
        this.statsSection = document.getElementById('statsSection');
        this.totalImagesEl = document.getElementById('totalImages');
        this.successCountEl = document.getElementById('successCount');
        this.avgTimeEl = document.getElementById('avgTime');

        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Paste from clipboard (Ctrl+V / Cmd+V) - only when square tool is active
        document.addEventListener('paste', (e) => {
            if (document.getElementById('squareTool').classList.contains('active')) {
                this.handlePaste(e);
            }
        });

        // Background type toggle
        this.bgTypeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.bgTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.bgType = btn.dataset.value;

                // Show/hide color setting based on type
                if (this.settings.bgType === 'color') {
                    this.colorSetting.style.display = 'flex';
                } else {
                    this.colorSetting.style.display = 'none';
                }

                // Show/hide smart settings based on type
                if (this.settings.bgType === 'smart') {
                    this.smartSettings.classList.add('active');
                } else {
                    this.smartSettings.classList.remove('active');
                }

                // Re-process all images with new settings
                this.reprocessAllImages();
            });
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                this.settings.bgColor = preset.dataset.color;
                this.customColor.value = preset.dataset.color;
                this.reprocessAllImages();
            });
        });

        // Custom color
        this.customColor.addEventListener('input', (e) => {
            document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
            this.settings.bgColor = e.target.value;
            this.reprocessAllImages();
        });

        // Format toggle
        this.formatToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.formatToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.format = btn.dataset.value;

                // Show/hide quality slider for JPEG/WebP
                if (this.settings.format === 'png') {
                    this.qualitySetting.style.display = 'none';
                } else {
                    this.qualitySetting.style.display = 'flex';
                }

                this.reprocessAllImages();
            });
        });

        // Quality slider
        this.qualitySlider.addEventListener('input', (e) => {
            this.settings.quality = e.target.value / 100;
            this.qualityValue.textContent = e.target.value;
        });

        this.qualitySlider.addEventListener('change', () => {
            this.reprocessAllImages();
        });

        // Blend feather slider (for Smart Extend)
        this.blendFeatherSlider.addEventListener('input', (e) => {
            this.settings.blendFeather = parseInt(e.target.value);
            this.blendFeatherValue.textContent = e.target.value;
        });

        this.blendFeatherSlider.addEventListener('change', () => {
            this.reprocessAllImages();
        });

        // Size type toggle (Auto/Custom)
        this.sizeTypeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sizeTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.sizeType = btn.dataset.value;

                // Show/hide custom size settings
                if (this.settings.sizeType === 'custom') {
                    this.customSizeSettings.classList.add('active');
                } else {
                    this.customSizeSettings.classList.remove('active');
                }

                this.reprocessAllImages();
            });
        });

        // Custom width input
        this.customWidthInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 1000;
            this.settings.customWidth = Math.max(10, Math.min(10000, value));

            if (this.settings.linkDimensions) {
                this.settings.customHeight = this.settings.customWidth;
                this.customHeightInput.value = this.settings.customWidth;
            }
        });

        this.customWidthInput.addEventListener('change', () => {
            this.reprocessAllImages();
        });

        // Custom height input
        this.customHeightInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 1000;
            this.settings.customHeight = Math.max(10, Math.min(10000, value));

            if (this.settings.linkDimensions) {
                this.settings.customWidth = this.settings.customHeight;
                this.customWidthInput.value = this.settings.customHeight;
            }
        });

        this.customHeightInput.addEventListener('change', () => {
            this.reprocessAllImages();
        });

        // Link dimensions button
        this.linkDimensionsBtn.addEventListener('click', () => {
            this.settings.linkDimensions = !this.settings.linkDimensions;
            this.linkDimensionsBtn.classList.toggle('active', this.settings.linkDimensions);

            if (this.settings.linkDimensions) {
                // Sync height to width when linking
                this.settings.customHeight = this.settings.customWidth;
                this.customHeightInput.value = this.settings.customWidth;
                this.reprocessAllImages();
            }
        });

        // Clear all
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Download all
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
    }

    /**
     * Handle paste event for clipboard images
     */
    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            this.handleFiles(imageFiles);
        }
    }

    async handleFiles(files) {
        if (!files.length) return;

        this.showLoading();
        this.settingsPanel.classList.add('active');
        this.previewSection.classList.add('active');
        this.statsSection.classList.add('active');

        // Separate ZIP files and image files
        const allFiles = Array.from(files);
        const zipFiles = allFiles.filter(file =>
            file.type === 'application/zip' ||
            file.type === 'application/x-zip-compressed' ||
            file.name.toLowerCase().endsWith('.zip')
        );
        const imageFiles = allFiles.filter(file => file.type.startsWith('image/'));

        // Process regular image files
        for (const file of imageFiles) {
            await this.processImage(file);
        }

        // Extract and process images from ZIP files
        for (const zipFile of zipFiles) {
            await this.processZipFile(zipFile);
        }

        this.hideLoading();
        this.updateStats();

        // Reset file input
        this.fileInput.value = '';
    }

    /**
     * Extract and process images from a ZIP file
     */
    async processZipFile(zipFile) {
        try {
            const zip = await JSZip.loadAsync(zipFile);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];

            // Get all image files from the ZIP
            const imagePromises = [];

            zip.forEach((relativePath, zipEntry) => {
                // Skip directories and hidden files
                if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.startsWith('.')) {
                    return;
                }

                // Check if it's an image file
                const lowerPath = relativePath.toLowerCase();
                const isImage = imageExtensions.some(ext => lowerPath.endsWith(ext));

                if (isImage) {
                    imagePromises.push(this.extractAndProcessImage(zipEntry, relativePath));
                }
            });

            // Process all images from the ZIP
            await Promise.all(imagePromises);
        } catch (error) {
            console.error('Error processing ZIP file:', error);
            // Show error notification if needed
        }
    }

    /**
     * Extract a single image from ZIP and process it
     */
    async extractAndProcessImage(zipEntry, filename) {
        try {
            // Get the file data as base64
            const base64Data = await zipEntry.async('base64');

            // Determine MIME type from extension
            const ext = filename.toLowerCase().split('.').pop();
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'bmp': 'image/bmp',
                'tiff': 'image/tiff',
                'tif': 'image/tiff'
            };
            const mimeType = mimeTypes[ext] || 'image/png';

            // Extract just the filename without path
            const cleanFilename = filename.split('/').pop();

            // Create data URL from base64
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            // Process the image directly from data URL
            await this.processImageFromDataUrl(dataUrl, cleanFilename);
        } catch (error) {
            console.error('Error extracting image from ZIP:', filename, error);
        }
    }

    /**
     * Process image from a data URL (for ZIP extracted images)
     */
    async processImageFromDataUrl(dataUrl, filename) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            const img = new Image();

            img.onload = async () => {
                const imageData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: filename,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    originalImage: img,
                    file: null // No file object for ZIP extracted images
                };

                // Process the image
                const result = await this.convertToSquare(imageData);
                imageData.squareDataUrl = result.dataUrl;
                imageData.squareSize = result.size;
                imageData.processingTime = performance.now() - startTime;

                this.images.push(imageData);
                this.stats.total++;
                this.stats.success++;
                this.stats.totalTime += imageData.processingTime;

                this.addPreviewItem(imageData);
                resolve();
            };

            img.onerror = (error) => {
                console.error('Failed to load image:', filename, error);
                resolve(); // Resolve anyway to continue with other images
            };

            img.src = dataUrl;
        });
    }

    async processImage(file) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const reader = new FileReader();

            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    const imageData = {
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        originalImage: img,
                        file: file
                    };

                    // Process the image
                    const result = await this.convertToSquare(imageData);
                    imageData.squareDataUrl = result.dataUrl;
                    imageData.squareSize = result.size;
                    imageData.processingTime = performance.now() - startTime;

                    this.images.push(imageData);
                    this.stats.total++;
                    this.stats.success++;
                    this.stats.totalTime += imageData.processingTime;

                    this.addPreviewItem(imageData);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async convertToSquare(imageData) {
        const img = imageData.originalImage;

        // Determine canvas dimensions based on size type
        let canvasWidth, canvasHeight;

        if (this.settings.sizeType === 'custom') {
            canvasWidth = this.settings.customWidth;
            canvasHeight = this.settings.customHeight;
        } else {
            // Auto mode: square based on largest dimension
            const maxDimension = Math.max(img.width, img.height);
            canvasWidth = maxDimension;
            canvasHeight = maxDimension;
        }

        // Create canvas with target dimensions
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        // Calculate how to fit the image without stretching
        // Scale image to fit within canvas while maintaining aspect ratio
        let drawWidth = img.width;
        let drawHeight = img.height;

        // Check if image needs to be scaled down to fit
        if (drawWidth > canvasWidth || drawHeight > canvasHeight) {
            const scaleX = canvasWidth / drawWidth;
            const scaleY = canvasHeight / drawHeight;
            const scale = Math.min(scaleX, scaleY);
            drawWidth = Math.floor(drawWidth * scale);
            drawHeight = Math.floor(drawHeight * scale);
        }

        // Calculate position to center the image
        const x = Math.floor((canvasWidth - drawWidth) / 2);
        const y = Math.floor((canvasHeight - drawHeight) / 2);

        // Fill background based on settings
        if (this.settings.bgType === 'transparent') {
            // Clear canvas (transparent)
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        } else if (this.settings.bgType === 'blur') {
            // Create blurred background extension
            await this.createBlurBackground(ctx, img, canvasWidth, canvasHeight);
        } else if (this.settings.bgType === 'smart') {
            // Create smart edge-extended background
            await this.createSmartBackground(ctx, img, canvasWidth, canvasHeight, x, y, drawWidth, drawHeight);
        } else {
            // Solid color background
            ctx.fillStyle = this.settings.bgColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // Draw the original image centered (scaled if needed)
        // For Smart Extend, apply feathered edge blending
        if (this.settings.bgType === 'smart' && this.settings.blendFeather !== 0) {
            if (this.settings.blendFeather < 0) {
                // Negative: Draw image first, then overlay AI background on edges
                ctx.drawImage(img, x, y, drawWidth, drawHeight);
                await this.overlayAIBackgroundOnEdges(ctx, img, x, y, Math.abs(this.settings.blendFeather), canvasWidth, canvasHeight, drawWidth, drawHeight);
            } else {
                // Positive: Draw image with feathered edges (original behavior)
                await this.drawImageWithFeatheredEdges(ctx, img, x, y, this.settings.blendFeather, canvasWidth, drawWidth, drawHeight);
            }
        } else {
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
        }

        // Get the format mime type
        const mimeType = this.getMimeType();
        const quality = this.settings.format === 'png' ? 1 : this.settings.quality;

        return {
            dataUrl: canvas.toDataURL(mimeType, quality),
            size: `${canvasWidth}x${canvasHeight}`
        };
    }

    /**
     * Overlay the AI-generated background ON TOP of image edges
     * This makes the AI background "eat into" the original image
     */
    async overlayAIBackgroundOnEdges(ctx, img, imgX, imgY, insetAmount, canvasWidth, canvasHeight, drawWidth, drawHeight) {
        const imgWidth = drawWidth || img.width;
        const imgHeight = drawHeight || img.height;

        // We need to capture the AI background that's already drawn on the canvas
        // and overlay parts of it on top of the image with gradients

        // Get the current canvas content (which has the AI background)
        const bgImageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

        // Create overlay canvas for the edge overlays
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = canvasWidth;
        overlayCanvas.height = canvasHeight;
        const overlayCtx = overlayCanvas.getContext('2d');

        // Put the background data on overlay canvas
        overlayCtx.putImageData(bgImageData, 0, 0);

        // Get overlay data to apply gradient alpha
        const overlayData = overlayCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        const pixels = overlayData.data;

        // Calculate image bounds
        const imgEndX = imgX + imgWidth;
        const imgEndY = imgY + imgHeight;

        // Apply gradient alpha - fade out as we go INTO the image
        for (let y = 0; y < canvasHeight; y++) {
            for (let x = 0; x < canvasWidth; x++) {
                const i = (y * canvasWidth + x) * 4;

                // Check if this pixel is within the image area
                const inImageX = x >= imgX && x < imgEndX;
                const inImageY = y >= imgY && y < imgEndY;

                if (inImageX && inImageY) {
                    // Inside image area - calculate distance from image edge
                    const distFromLeft = x - imgX;
                    const distFromRight = imgEndX - 1 - x;
                    const distFromTop = y - imgY;
                    const distFromBottom = imgEndY - 1 - y;

                    const minDistX = Math.min(distFromLeft, distFromRight);
                    const minDistY = Math.min(distFromTop, distFromBottom);
                    const minDist = Math.min(minDistX, minDistY);

                    if (minDist < insetAmount) {
                        // Within the overlap zone - gradient from edge
                        const t = minDist / insetAmount;
                        // Fade out as we go deeper into image (invert: full at edge, zero inside)
                        const alpha = (1 - t) * (1 - t); // Smooth fade inward
                        pixels[i + 3] = Math.round(255 * alpha);
                    } else {
                        // Deep inside image - no overlay
                        pixels[i + 3] = 0;
                    }
                } else {
                    // Outside image area - no overlay needed here (already has background)
                    pixels[i + 3] = 0;
                }
            }
        }

        overlayCtx.putImageData(overlayData, 0, 0);

        // Draw the gradient overlay on top of the existing canvas
        ctx.drawImage(overlayCanvas, 0, 0);
    }

    /**
     * Draw image with feathered/blended edges for smooth transition
     * Positive featherSize: Image edges fade into AI background
     */
    async drawImageWithFeatheredEdges(ctx, img, x, y, featherSize, canvasSize, drawWidth, drawHeight) {
        const width = drawWidth || img.width;
        const height = drawHeight || img.height;

        // Create a temporary canvas for the image with alpha mask
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the original image scaled to draw dimensions
        tempCtx.drawImage(img, 0, 0, width, height);

        // Get image data to apply feather
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // Apply feather effect to edges
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const i = (py * width + px) * 4;

                // Calculate distance from each edge
                const distFromLeft = px;
                const distFromRight = width - 1 - px;
                const distFromTop = py;
                const distFromBottom = height - 1 - py;

                // Find minimum distance to any edge
                const minDistX = Math.min(distFromLeft, distFromRight);
                const minDistY = Math.min(distFromTop, distFromBottom);
                const minDist = Math.min(minDistX, minDistY);

                // Calculate alpha based on distance from edge
                if (minDist < featherSize) {
                    // Create smooth gradient using easeInOut curve for better blending
                    const t = minDist / featherSize;
                    const alpha = t * t * (3 - 2 * t); // Smooth step

                    // Apply alpha to existing alpha channel
                    pixels[i + 3] = Math.round(pixels[i + 3] * alpha);
                }
            }
        }

        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, x, y);
    }

    async createBlurBackground(ctx, img, canvasWidth, canvasHeight) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight || canvasWidth;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw scaled/stretched image to fill the canvas
        tempCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight || canvasWidth);

        // Apply blur effect
        ctx.filter = 'blur(50px) brightness(0.7)';
        ctx.drawImage(tempCanvas, 0, 0, canvasWidth, canvasHeight || canvasWidth);
        ctx.filter = 'none';
    }

    /**
     * Smart Background Extension Algorithm
     * Samples edge pixels and extends them naturally to fill the canvas
     * Works great for gradient backgrounds
     */
    async createSmartBackground(ctx, img, canvasWidth, canvasHeight, imgX, imgY, drawWidth, drawHeight) {
        const imgWidth = drawWidth || img.width;
        const imgHeight = drawHeight || img.height;

        // Create a temporary canvas to get pixel data from the original image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgWidth;
        tempCanvas.height = imgHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);

        // Sample depth - how many pixels from the edge to sample
        const sampleDepth = Math.min(50, Math.floor(Math.min(imgWidth, imgHeight) * 0.1));

        // Get image data for edge sampling
        const imageData = tempCtx.getImageData(0, 0, imgWidth, imgHeight);
        const pixels = imageData.data;

        // Helper to get pixel color at x, y
        const getPixel = (x, y) => {
            const i = (y * imgWidth + x) * 4;
            return {
                r: pixels[i],
                g: pixels[i + 1],
                b: pixels[i + 2],
                a: pixels[i + 3]
            };
        };

        // Helper to average multiple pixels
        const averagePixels = (pixelArray) => {
            const sum = { r: 0, g: 0, b: 0, a: 0 };
            pixelArray.forEach(p => {
                sum.r += p.r;
                sum.g += p.g;
                sum.b += p.b;
                sum.a += p.a;
            });
            const count = pixelArray.length;
            return {
                r: Math.round(sum.r / count),
                g: Math.round(sum.g / count),
                b: Math.round(sum.b / count),
                a: Math.round(sum.a / count)
            };
        };

        // Sample colors from each edge
        const sampleEdge = (edge) => {
            const samples = [];
            const segments = 20; // Number of sample points along each edge

            for (let i = 0; i < segments; i++) {
                let edgeSamples = [];

                if (edge === 'top') {
                    const x = Math.floor((i / segments) * imgWidth);
                    for (let d = 0; d < sampleDepth; d++) {
                        if (d < imgHeight) edgeSamples.push(getPixel(Math.min(x, imgWidth - 1), d));
                    }
                } else if (edge === 'bottom') {
                    const x = Math.floor((i / segments) * imgWidth);
                    for (let d = 0; d < sampleDepth; d++) {
                        if (imgHeight - 1 - d >= 0) edgeSamples.push(getPixel(Math.min(x, imgWidth - 1), imgHeight - 1 - d));
                    }
                } else if (edge === 'left') {
                    const y = Math.floor((i / segments) * imgHeight);
                    for (let d = 0; d < sampleDepth; d++) {
                        if (d < imgWidth) edgeSamples.push(getPixel(d, Math.min(y, imgHeight - 1)));
                    }
                } else if (edge === 'right') {
                    const y = Math.floor((i / segments) * imgHeight);
                    for (let d = 0; d < sampleDepth; d++) {
                        if (imgWidth - 1 - d >= 0) edgeSamples.push(getPixel(imgWidth - 1 - d, Math.min(y, imgHeight - 1)));
                    }
                }

                if (edgeSamples.length > 0) {
                    samples.push({
                        position: i / segments,
                        color: averagePixels(edgeSamples)
                    });
                }
            }
            return samples;
        };

        // Get samples from all edges
        const topSamples = sampleEdge('top');
        const bottomSamples = sampleEdge('bottom');
        const leftSamples = sampleEdge('left');
        const rightSamples = sampleEdge('right');

        // Get corner colors
        const cornerTL = averagePixels([getPixel(0, 0), getPixel(1, 0), getPixel(0, 1), getPixel(1, 1)]);
        const cornerTR = averagePixels([getPixel(imgWidth - 1, 0), getPixel(imgWidth - 2, 0), getPixel(imgWidth - 1, 1), getPixel(imgWidth - 2, 1)]);
        const cornerBL = averagePixels([getPixel(0, imgHeight - 1), getPixel(1, imgHeight - 1), getPixel(0, imgHeight - 2), getPixel(1, imgHeight - 2)]);
        const cornerBR = averagePixels([getPixel(imgWidth - 1, imgHeight - 1), getPixel(imgWidth - 2, imgHeight - 1), getPixel(imgWidth - 1, imgHeight - 2), getPixel(imgWidth - 2, imgHeight - 2)]);

        // Create output canvas for the smart background
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = canvasWidth;
        outputCanvas.height = canvasHeight;
        const outCtx = outputCanvas.getContext('2d');

        // Calculate regions
        const imgEndX = imgX + imgWidth;
        const imgEndY = imgY + imgHeight;

        // Helper to interpolate between colors
        const lerpColor = (c1, c2, t) => ({
            r: Math.round(c1.r + (c2.r - c1.r) * t),
            g: Math.round(c1.g + (c2.g - c1.g) * t),
            b: Math.round(c1.b + (c2.b - c1.b) * t),
            a: Math.round(c1.a + (c2.a - c1.a) * t)
        });

        // Helper to get color from samples at a position
        const getColorFromSamples = (samples, position) => {
            if (samples.length === 0) return { r: 128, g: 128, b: 128, a: 255 };

            // Find surrounding samples
            let lower = samples[0];
            let upper = samples[samples.length - 1];

            for (let i = 0; i < samples.length - 1; i++) {
                if (samples[i].position <= position && samples[i + 1].position >= position) {
                    lower = samples[i];
                    upper = samples[i + 1];
                    break;
                }
            }

            // Interpolate between the two samples
            const range = upper.position - lower.position;
            const t = range > 0 ? (position - lower.position) / range : 0;
            return lerpColor(lower.color, upper.color, t);
        };

        // Create ImageData for the output
        const outImageData = outCtx.createImageData(canvasWidth, canvasHeight);
        const outPixels = outImageData.data;

        // Fill each pixel based on position
        for (let y = 0; y < canvasHeight; y++) {
            for (let x = 0; x < canvasWidth; x++) {
                let color;

                // Determine which region this pixel is in
                const inImageX = x >= imgX && x < imgEndX;
                const inImageY = y >= imgY && y < imgEndY;

                if (inImageX && inImageY) {
                    // Inside the original image area - will be covered by the image
                    color = { r: 0, g: 0, b: 0, a: 0 };
                } else if (y < imgY && x < imgX) {
                    // Top-left corner
                    const distX = (imgX - x) / imgX;
                    const distY = (imgY - y) / imgY;
                    const edgeColorX = getColorFromSamples(leftSamples, 0);
                    const edgeColorY = getColorFromSamples(topSamples, 0);
                    color = lerpColor(lerpColor(edgeColorX, cornerTL, distY), lerpColor(edgeColorY, cornerTL, distX), 0.5);
                } else if (y < imgY && x >= imgEndX) {
                    // Top-right corner
                    const distX = (x - imgEndX) / (canvasWidth - imgEndX);
                    const distY = (imgY - y) / imgY;
                    const edgeColorX = getColorFromSamples(rightSamples, 0);
                    const edgeColorY = getColorFromSamples(topSamples, 1);
                    color = lerpColor(lerpColor(edgeColorX, cornerTR, distY), lerpColor(edgeColorY, cornerTR, distX), 0.5);
                } else if (y >= imgEndY && x < imgX) {
                    // Bottom-left corner
                    const distX = (imgX - x) / imgX;
                    const distY = (y - imgEndY) / (canvasHeight - imgEndY);
                    const edgeColorX = getColorFromSamples(leftSamples, 1);
                    const edgeColorY = getColorFromSamples(bottomSamples, 0);
                    color = lerpColor(lerpColor(edgeColorX, cornerBL, distY), lerpColor(edgeColorY, cornerBL, distX), 0.5);
                } else if (y >= imgEndY && x >= imgEndX) {
                    // Bottom-right corner
                    const distX = (x - imgEndX) / (canvasWidth - imgEndX);
                    const distY = (y - imgEndY) / (canvasHeight - imgEndY);
                    const edgeColorX = getColorFromSamples(rightSamples, 1);
                    const edgeColorY = getColorFromSamples(bottomSamples, 1);
                    color = lerpColor(lerpColor(edgeColorX, cornerBR, distY), lerpColor(edgeColorY, cornerBR, distX), 0.5);
                } else if (y < imgY) {
                    // Top edge
                    const posX = (x - imgX) / imgWidth;
                    color = getColorFromSamples(topSamples, posX);
                } else if (y >= imgEndY) {
                    // Bottom edge
                    const posX = (x - imgX) / imgWidth;
                    color = getColorFromSamples(bottomSamples, posX);
                } else if (x < imgX) {
                    // Left edge
                    const posY = (y - imgY) / imgHeight;
                    color = getColorFromSamples(leftSamples, posY);
                } else if (x >= imgEndX) {
                    // Right edge
                    const posY = (y - imgY) / imgHeight;
                    color = getColorFromSamples(rightSamples, posY);
                } else {
                    color = { r: 0, g: 0, b: 0, a: 0 };
                }

                const i = (y * canvasWidth + x) * 4;
                outPixels[i] = color.r;
                outPixels[i + 1] = color.g;
                outPixels[i + 2] = color.b;
                outPixels[i + 3] = color.a;
            }
        }

        outCtx.putImageData(outImageData, 0, 0);

        // Apply a slight blur to smooth the transitions
        ctx.filter = 'blur(2px)';
        ctx.drawImage(outputCanvas, 0, 0);
        ctx.filter = 'none';

        // Draw a sharper version on top with slight transparency for crispness
        ctx.globalAlpha = 0.7;
        ctx.drawImage(outputCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
    }

    getMimeType() {
        const types = {
            'png': 'image/png',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp'
        };
        return types[this.settings.format] || 'image/png';
    }

    getFileExtension() {
        const extensions = {
            'png': 'png',
            'jpeg': 'jpg',
            'webp': 'webp'
        };
        return extensions[this.settings.format] || 'png';
    }

    addPreviewItem(imageData) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.id = imageData.id;

        const originalDim = `${imageData.originalWidth}×${imageData.originalHeight}`;
        const newDim = `${imageData.squareSize}×${imageData.squareSize}`;

        item.innerHTML = `
            <div class="preview-image-container">
                <img src="${imageData.squareDataUrl}" alt="${imageData.name}" class="preview-image">
                <span class="preview-badge">1:1</span>
            </div>
            <div class="preview-info">
                <div class="preview-filename" title="${imageData.name}">${this.truncateFilename(imageData.name)}</div>
                <div class="preview-dimensions">
                    <span><i class="fas fa-arrows-alt"></i> ${originalDim}</span>
                    <span class="dimension-arrow"><i class="fas fa-arrow-right"></i></span>
                    <span><i class="fas fa-square"></i> ${newDim}</span>
                </div>
                <div class="preview-actions-row">
                    <button class="btn btn-secondary btn-sm" onclick="imageSquare.downloadSingle('${imageData.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="imageSquare.removeSingle('${imageData.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        this.previewGrid.appendChild(item);
    }

    truncateFilename(filename, maxLength = 25) {
        if (filename.length <= maxLength) return filename;
        const ext = filename.split('.').pop();
        const name = filename.substring(0, filename.lastIndexOf('.'));
        const truncated = name.substring(0, maxLength - ext.length - 4);
        return `${truncated}...${ext}`;
    }

    async reprocessAllImages() {
        if (!this.images.length) return;

        this.showLoading();

        for (const imageData of this.images) {
            const result = await this.convertToSquare(imageData);
            imageData.squareDataUrl = result.dataUrl;
            imageData.squareSize = result.size;

            // Update preview
            const item = document.querySelector(`.preview-item[data-id="${imageData.id}"]`);
            if (item) {
                const img = item.querySelector('.preview-image');
                img.src = imageData.squareDataUrl;

                const dims = item.querySelector('.preview-dimensions');
                const newDim = `${imageData.squareSize}×${imageData.squareSize}`;
                dims.lastElementChild.innerHTML = `<i class="fas fa-square"></i> ${newDim}`;
            }
        }

        this.hideLoading();
    }

    downloadSingle(id) {
        const imageData = this.images.find(img => img.id === id);
        if (!imageData) return;

        const link = document.createElement('a');
        const baseName = imageData.name.substring(0, imageData.name.lastIndexOf('.')) || imageData.name;
        link.download = `${baseName}_square.${this.getFileExtension()}`;
        link.href = imageData.squareDataUrl;
        link.click();
    }

    removeSingle(id) {
        this.images = this.images.filter(img => img.id !== id);
        const item = document.querySelector(`.preview-item[data-id="${id}"]`);
        if (item) {
            item.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => item.remove(), 300);
        }

        if (!this.images.length) {
            this.settingsPanel.classList.remove('active');
            this.previewSection.classList.remove('active');
            this.statsSection.classList.remove('active');
        }

        this.updateStats();
    }

    async downloadAll() {
        if (!this.images.length) return;

        // If single image, just download directly
        if (this.images.length === 1) {
            this.downloadSingle(this.images[0].id);
            return;
        }

        // For multiple images, create ZIP file
        this.showLoading();

        try {
            const zip = new JSZip();
            const imgFolder = zip.folder('imgkit-squares');

            for (const imageData of this.images) {
                const baseName = imageData.name.substring(0, imageData.name.lastIndexOf('.')) || imageData.name;
                const fileName = `${baseName}_square.${this.getFileExtension()}`;

                // Convert data URL to blob
                const base64Data = imageData.squareDataUrl.split(',')[1];
                imgFolder.file(fileName, base64Data, { base64: true });
            }

            // Generate ZIP and download
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'imgkit-squares.zip';
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('ZIP creation failed:', error);
            // Fallback to individual downloads
            this.images.forEach((imageData, index) => {
                setTimeout(() => {
                    this.downloadSingle(imageData.id);
                }, index * 300);
            });
        }

        this.hideLoading();
    }

    clearAll() {
        this.images = [];
        this.previewGrid.innerHTML = '';
        this.settingsPanel.classList.remove('active');
        this.previewSection.classList.remove('active');
        this.statsSection.classList.remove('active');
        this.stats = { total: 0, success: 0, totalTime: 0 };
        this.updateStats();
    }

    updateStats() {
        this.totalImagesEl.textContent = this.stats.total;
        this.successCountEl.textContent = this.stats.success;
        const avgTime = this.stats.total > 0 ? Math.round(this.stats.totalTime / this.stats.total) : 0;
        this.avgTimeEl.textContent = `${avgTime}ms`;
    }

    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize the app
const imageSquare = new ImageSquare();

/**
 * ImageConverter - Format Converter Tool
 * Converts images between formats with no quality loss
 */
class ImageConverter {
    constructor() {
        this.images = [];
        this.settings = {
            format: 'webp',
            quality: 0.92 // 92% quality - visually lossless with good compression
        };
        this.stats = {
            total: 0,
            totalOriginalSize: 0,
            totalConvertedSize: 0,
            totalTime: 0
        };

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        // Upload elements
        this.uploadArea = document.getElementById('converterUploadArea');
        this.fileInput = document.getElementById('converterFileInput');

        // Settings elements
        this.settingsPanel = document.getElementById('converterSettingsPanel');
        this.formatToggle = document.getElementById('converterFormatToggle');
        this.qualitySlider = document.getElementById('converterQualitySlider');
        this.qualityValue = document.getElementById('converterQualityValue');
        this.qualitySetting = document.getElementById('converterQualitySetting');

        // Preview elements
        this.previewSection = document.getElementById('converterPreviewSection');
        this.previewGrid = document.getElementById('converterPreviewGrid');
        this.clearAllBtn = document.getElementById('converterClearAll');
        this.downloadAllBtn = document.getElementById('converterDownloadAll');

        // Stats elements
        this.statsSection = document.getElementById('converterStatsSection');
        this.totalImagesEl = document.getElementById('converterTotalImages');
        this.sizeSavedEl = document.getElementById('converterSizeSaved');
        this.avgTimeEl = document.getElementById('converterAvgTime');

        // Loading overlay (shared)
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Paste from clipboard (Ctrl+V / Cmd+V) - only when converter tool is active
        document.addEventListener('paste', (e) => {
            if (document.getElementById('converterTool').classList.contains('active')) {
                this.handlePaste(e);
            }
        });

        // Format toggle
        this.formatToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.formatToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.format = btn.dataset.value;

                // Show/hide quality slider for lossy formats
                if (this.settings.format === 'png' || this.settings.format === 'bmp' || this.settings.format === 'gif') {
                    this.qualitySetting.style.display = 'none';
                } else {
                    this.qualitySetting.style.display = 'flex';
                }

                this.reprocessAllImages();
            });
        });

        // Quality slider
        this.qualitySlider.addEventListener('input', (e) => {
            this.settings.quality = e.target.value / 100;
            this.qualityValue.textContent = e.target.value;
        });

        this.qualitySlider.addEventListener('change', () => {
            this.reprocessAllImages();
        });

        // Clear all
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Download all
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
    }

    /**
     * Handle paste event for clipboard images
     */
    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            this.handleFiles(imageFiles);
        }
    }

    async handleFiles(files) {
        if (!files.length) return;

        this.showLoading();
        this.settingsPanel.classList.add('active');
        this.previewSection.classList.add('active');
        this.statsSection.classList.add('active');

        // Separate ZIP files and image files
        const allFiles = Array.from(files);
        const zipFiles = allFiles.filter(file =>
            file.type === 'application/zip' ||
            file.type === 'application/x-zip-compressed' ||
            file.name.toLowerCase().endsWith('.zip')
        );
        const imageFiles = allFiles.filter(file => file.type.startsWith('image/'));

        // Process regular image files
        for (const file of imageFiles) {
            await this.processImage(file);
        }

        // Extract and process images from ZIP files
        for (const zipFile of zipFiles) {
            await this.processZipFile(zipFile);
        }

        this.hideLoading();
        this.updateStats();

        // Reset file input
        this.fileInput.value = '';
    }

    /**
     * Extract and process images from a ZIP file
     */
    async processZipFile(zipFile) {
        try {
            const zip = await JSZip.loadAsync(zipFile);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];

            // Get all image files from the ZIP
            const imagePromises = [];

            zip.forEach((relativePath, zipEntry) => {
                // Skip directories and hidden files
                if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.startsWith('.')) {
                    return;
                }

                // Check if it's an image file
                const lowerPath = relativePath.toLowerCase();
                const isImage = imageExtensions.some(ext => lowerPath.endsWith(ext));

                if (isImage) {
                    imagePromises.push(this.extractAndProcessImage(zipEntry, relativePath));
                }
            });

            // Process all images from the ZIP
            await Promise.all(imagePromises);
        } catch (error) {
            console.error('Error processing ZIP file:', error);
        }
    }

    /**
     * Extract a single image from ZIP and process it
     */
    async extractAndProcessImage(zipEntry, filename) {
        try {
            // Get the file data as base64
            const base64Data = await zipEntry.async('base64');

            // Determine MIME type from extension
            const ext = filename.toLowerCase().split('.').pop();
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'bmp': 'image/bmp',
                'tiff': 'image/tiff',
                'tif': 'image/tiff'
            };
            const mimeType = mimeTypes[ext] || 'image/png';

            // Extract just the filename without path
            const cleanFilename = filename.split('/').pop();

            // Create data URL from base64
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            // Estimate original file size from base64 (approximate)
            const estimatedSize = Math.round((base64Data.length * 3) / 4);

            // Process the image directly from data URL
            await this.processImageFromDataUrl(dataUrl, cleanFilename, mimeType, estimatedSize);
        } catch (error) {
            console.error('Error extracting image from ZIP:', filename, error);
        }
    }

    /**
     * Process image from a data URL (for ZIP extracted images)
     */
    async processImageFromDataUrl(dataUrl, filename, mimeType, originalSize) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const img = new Image();

            img.onload = async () => {
                const imageData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: filename,
                    originalFormat: this.getFormatFromMime(mimeType),
                    originalSize: originalSize,
                    width: img.width,
                    height: img.height,
                    originalImage: img,
                    file: null
                };

                // Convert the image
                const result = await this.convertImage(imageData);
                imageData.convertedDataUrl = result.dataUrl;
                imageData.convertedSize = result.size;
                imageData.convertedFormat = this.settings.format;
                imageData.processingTime = performance.now() - startTime;

                this.images.push(imageData);
                this.stats.total++;
                this.stats.totalOriginalSize += imageData.originalSize;
                this.stats.totalConvertedSize += imageData.convertedSize;
                this.stats.totalTime += imageData.processingTime;

                this.addPreviewItem(imageData);
                resolve();
            };

            img.onerror = (error) => {
                console.error('Failed to load image:', filename, error);
                resolve(); // Resolve anyway to continue with other images
            };

            img.src = dataUrl;
        });
    }

    async processImage(file) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const reader = new FileReader();

            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    const imageData = {
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        originalFormat: this.getFormatFromMime(file.type),
                        originalSize: file.size,
                        width: img.width,
                        height: img.height,
                        originalImage: img,
                        file: file
                    };

                    // Convert the image
                    const result = await this.convertImage(imageData);
                    imageData.convertedDataUrl = result.dataUrl;
                    imageData.convertedSize = result.size;
                    imageData.convertedFormat = this.settings.format;
                    imageData.processingTime = performance.now() - startTime;

                    this.images.push(imageData);
                    this.stats.total++;
                    this.stats.totalOriginalSize += imageData.originalSize;
                    this.stats.totalConvertedSize += imageData.convertedSize;
                    this.stats.totalTime += imageData.processingTime;

                    this.addPreviewItem(imageData);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async convertImage(imageData) {
        const img = imageData.originalImage;

        // Create canvas at original dimensions (no scaling)
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Draw image at native resolution
        ctx.drawImage(img, 0, 0);

        // Get the format mime type
        const mimeType = this.getMimeType();

        // Use maximum quality for lossless conversion
        // For PNG and BMP, quality is ignored
        // For WebP and JPEG, use 1.0 (100%) by default
        const quality = this.settings.quality;

        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Calculate the file size from base64
        const base64 = dataUrl.split(',')[1];
        const size = Math.round((base64.length * 3) / 4);

        return {
            dataUrl: dataUrl,
            size: size
        };
    }

    getFormatFromMime(mimeType) {
        const formats = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff'
        };
        return formats[mimeType] || 'unknown';
    }

    getMimeType() {
        const types = {
            'png': 'image/png',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp',
            'gif': 'image/gif',
            'bmp': 'image/bmp'
        };
        return types[this.settings.format] || 'image/png';
    }

    getFileExtension() {
        const extensions = {
            'png': 'png',
            'jpeg': 'jpg',
            'webp': 'webp',
            'gif': 'gif',
            'bmp': 'bmp'
        };
        return extensions[this.settings.format] || 'png';
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    addPreviewItem(imageData) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.id = imageData.id;

        const sizeDiff = imageData.convertedSize - imageData.originalSize;
        const sizePct = Math.round((sizeDiff / imageData.originalSize) * 100);
        const sizeClass = sizeDiff < 0 ? 'size-saved' : 'size-increased';
        const sizeText = sizeDiff < 0 ? `${Math.abs(sizePct)}% smaller` : `${sizePct}% larger`;

        item.innerHTML = `
            <div class="preview-image-container">
                <img src="${imageData.convertedDataUrl}" alt="${imageData.name}" class="preview-image">
                <span class="preview-badge">${this.settings.format.toUpperCase()}</span>
            </div>
            <div class="preview-info">
                <div class="preview-filename" title="${imageData.name}">${this.truncateFilename(imageData.name)}</div>
                <div class="format-change">
                    <span class="format-from">${imageData.originalFormat}</span>
                    <i class="fas fa-arrow-right"></i>
                    <span class="format-to">${imageData.convertedFormat}</span>
                </div>
                <div class="file-size-info">
                    <span class="size-original">${this.formatFileSize(imageData.originalSize)}</span>
                    <span class="size-arrow"><i class="fas fa-arrow-right"></i></span>
                    <span class="size-converted">${this.formatFileSize(imageData.convertedSize)}</span>
                    <span class="${sizeClass}">${sizeText}</span>
                </div>
                <div class="preview-actions-row">
                    <button class="btn btn-secondary btn-sm" onclick="imageConverter.downloadSingle('${imageData.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="imageConverter.removeSingle('${imageData.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        this.previewGrid.appendChild(item);
    }

    truncateFilename(filename, maxLength = 25) {
        if (filename.length <= maxLength) return filename;
        const ext = filename.split('.').pop();
        const name = filename.substring(0, filename.lastIndexOf('.'));
        const truncated = name.substring(0, maxLength - ext.length - 4);
        return `${truncated}...${ext}`;
    }

    async reprocessAllImages() {
        if (!this.images.length) return;

        this.showLoading();

        // Reset stats for recalculation
        this.stats.totalConvertedSize = 0;

        for (const imageData of this.images) {
            const result = await this.convertImage(imageData);
            imageData.convertedDataUrl = result.dataUrl;
            imageData.convertedSize = result.size;
            imageData.convertedFormat = this.settings.format;

            this.stats.totalConvertedSize += imageData.convertedSize;

            // Update preview
            const item = this.previewGrid.querySelector(`.preview-item[data-id="${imageData.id}"]`);
            if (item) {
                const img = item.querySelector('.preview-image');
                img.src = imageData.convertedDataUrl;

                const badge = item.querySelector('.preview-badge');
                badge.textContent = this.settings.format.toUpperCase();

                const formatTo = item.querySelector('.format-to');
                formatTo.textContent = this.settings.format;

                // Update size info
                const sizeDiff = imageData.convertedSize - imageData.originalSize;
                const sizePct = Math.round((sizeDiff / imageData.originalSize) * 100);
                const sizeClass = sizeDiff < 0 ? 'size-saved' : 'size-increased';
                const sizeText = sizeDiff < 0 ? `${Math.abs(sizePct)}% smaller` : `${sizePct}% larger`;

                const sizeInfo = item.querySelector('.file-size-info');
                sizeInfo.innerHTML = `
                    <span class="size-original">${this.formatFileSize(imageData.originalSize)}</span>
                    <span class="size-arrow"><i class="fas fa-arrow-right"></i></span>
                    <span class="size-converted">${this.formatFileSize(imageData.convertedSize)}</span>
                    <span class="${sizeClass}">${sizeText}</span>
                `;
            }
        }

        this.updateStats();
        this.hideLoading();
    }

    downloadSingle(id) {
        const imageData = this.images.find(img => img.id === id);
        if (!imageData) return;

        const link = document.createElement('a');
        const baseName = imageData.name.substring(0, imageData.name.lastIndexOf('.')) || imageData.name;
        link.download = `${baseName}.${this.getFileExtension()}`;
        link.href = imageData.convertedDataUrl;
        link.click();
    }

    removeSingle(id) {
        const imageData = this.images.find(img => img.id === id);
        if (imageData) {
            this.stats.totalOriginalSize -= imageData.originalSize;
            this.stats.totalConvertedSize -= imageData.convertedSize;
            this.stats.total--;
        }

        this.images = this.images.filter(img => img.id !== id);
        const item = this.previewGrid.querySelector(`.preview-item[data-id="${id}"]`);
        if (item) {
            item.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => item.remove(), 300);
        }

        if (!this.images.length) {
            this.settingsPanel.classList.remove('active');
            this.previewSection.classList.remove('active');
            this.statsSection.classList.remove('active');
        }

        this.updateStats();
    }

    async downloadAll() {
        if (!this.images.length) return;

        // If single image, just download directly
        if (this.images.length === 1) {
            this.downloadSingle(this.images[0].id);
            return;
        }

        // For multiple images, create ZIP file
        this.showLoading();

        try {
            const zip = new JSZip();
            const imgFolder = zip.folder('imgkit-converted');

            for (const imageData of this.images) {
                const baseName = imageData.name.substring(0, imageData.name.lastIndexOf('.')) || imageData.name;
                const fileName = `${baseName}.${this.getFileExtension()}`;

                // Convert data URL to blob
                const base64Data = imageData.convertedDataUrl.split(',')[1];
                imgFolder.file(fileName, base64Data, { base64: true });
            }

            // Generate ZIP and download
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'imgkit-converted.zip';
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('ZIP creation failed:', error);
            // Fallback to individual downloads
            this.images.forEach((imageData, index) => {
                setTimeout(() => {
                    this.downloadSingle(imageData.id);
                }, index * 300);
            });
        }

        this.hideLoading();
    }

    clearAll() {
        this.images = [];
        this.previewGrid.innerHTML = '';
        this.settingsPanel.classList.remove('active');
        this.previewSection.classList.remove('active');
        this.statsSection.classList.remove('active');
        this.stats = { total: 0, totalOriginalSize: 0, totalConvertedSize: 0, totalTime: 0 };
        this.updateStats();
    }

    updateStats() {
        this.totalImagesEl.textContent = this.stats.total;

        // Calculate average size reduction
        if (this.stats.totalOriginalSize > 0) {
            const reduction = ((this.stats.totalOriginalSize - this.stats.totalConvertedSize) / this.stats.totalOriginalSize) * 100;
            this.sizeSavedEl.textContent = `${reduction >= 0 ? '' : '+'}${Math.round(reduction)}%`;
        } else {
            this.sizeSavedEl.textContent = '0%';
        }

        const avgTime = this.stats.total > 0 ? Math.round(this.stats.totalTime / this.stats.total) : 0;
        this.avgTimeEl.textContent = `${avgTime}ms`;
    }

    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }
}

// Initialize the converter
const imageConverter = new ImageConverter();

/**
 * BackgroundRemover - AI-powered background removal
 */
class BackgroundRemover {
    constructor() {
        this.images = [];
        this.settings = {
            bgType: 'transparent',
            bgColor: '#95BF47'
        };
        this.stats = {
            total: 0,
            totalTime: 0
        };
        this.modelLoaded = false;
        this.isProcessing = false;

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        // Upload elements
        this.uploadArea = document.getElementById('removerUploadArea');
        this.fileInput = document.getElementById('removerFileInput');

        // Settings elements
        this.settingsPanel = document.getElementById('removerSettingsPanel');
        this.bgToggle = document.getElementById('removerBgToggle');
        this.colorPicker = document.getElementById('removerColorPicker');
        this.customColor = document.getElementById('removerCustomColor');

        // Preview elements
        this.previewSection = document.getElementById('removerPreviewSection');
        this.previewGrid = document.getElementById('removerPreviewGrid');
        this.clearAllBtn = document.getElementById('removerClearAll');
        this.downloadAllBtn = document.getElementById('removerDownloadAll');

        // Stats elements
        this.statsSection = document.getElementById('removerStatsSection');
        this.totalImagesEl = document.getElementById('removerTotalImages');
        this.avgTimeEl = document.getElementById('removerAvgTime');

        // Loading overlay (shared)
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Paste from clipboard
        document.addEventListener('paste', (e) => {
            if (document.getElementById('removerTool').classList.contains('active')) {
                this.handlePaste(e);
            }
        });

        // Background type toggle
        this.bgToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.bgToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.bgType = btn.dataset.value;

                // Show/hide color picker
                this.colorPicker.style.display = this.settings.bgType === 'color' ? 'flex' : 'none';

                // Reprocess if images exist
                if (this.images.length > 0) {
                    this.reprocessAllImages();
                }
            });
        });

        // Color presets
        this.colorPicker.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                this.settings.bgColor = preset.dataset.color;
                this.colorPicker.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                this.customColor.value = preset.dataset.color;
                if (this.images.length > 0) {
                    this.reprocessAllImages();
                }
            });
        });

        // Custom color
        this.customColor.addEventListener('input', (e) => {
            this.settings.bgColor = e.target.value;
            this.colorPicker.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
            if (this.images.length > 0) {
                this.reprocessAllImages();
            }
        });

        // Clear all
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Download all
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
    }

    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            this.handleFiles(imageFiles);
        }
    }

    async handleFiles(files) {
        if (!files.length) return;

        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (!imageFiles.length) return;

        this.settingsPanel.classList.add('active');
        this.previewSection.classList.add('active');
        this.statsSection.classList.add('active');

        for (const file of imageFiles) {
            await this.processImage(file);
        }

        this.fileInput.value = '';
    }

    showLoading(message = 'Processing...', isAI = true) {
        const loadingText = this.loadingOverlay.querySelector('p');
        if (loadingText) loadingText.textContent = message;
        this.loadingOverlay.classList.add('active');
        if (isAI) {
            this.loadingOverlay.classList.add('ai-mode');
        }
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
        this.loadingOverlay.classList.remove('ai-mode');
    }

    updateStats() {
        this.totalImagesEl.textContent = this.stats.total;
        const avgTime = this.stats.total > 0 ? (this.stats.totalTime / this.stats.total / 1000).toFixed(1) : 0;
        this.avgTimeEl.textContent = `${avgTime}s`;
    }

    clearAll() {
        this.images = [];
        this.previewGrid.innerHTML = '';
        this.previewSection.classList.remove('active');
        this.settingsPanel.classList.remove('active');
        this.statsSection.classList.remove('active');
        this.stats = { total: 0, totalTime: 0 };
        this.updateStats();
    }

    /**
     * Process a single image file
     */
    async processImage(file) {
        const startTime = performance.now();
        const id = Date.now() + Math.random();

        try {
            // Show loading with model status
            if (!this.modelLoaded) {
                this.showLoading('Loading AI model (first time only)...');
            } else {
                this.showLoading('Removing background...');
            }

            // Load image
            const originalDataUrl = await this.readFileAsDataUrl(file);
            const originalImg = await this.loadImage(originalDataUrl);

            // Remove background using AI
            const removedBlob = await this.removeBackground(file);
            const removedDataUrl = await this.blobToDataUrl(removedBlob);
            const removedImg = await this.loadImage(removedDataUrl);

            // Apply background color if needed
            const finalDataUrl = await this.applyBackground(removedImg);

            const endTime = performance.now();
            const processingTime = endTime - startTime;

            // Store image data
            const imageData = {
                id,
                name: file.name,
                originalDataUrl,
                removedDataUrl,  // Transparent version (cached)
                processedDataUrl: finalDataUrl,
                width: originalImg.width,
                height: originalImg.height,
                processingTime
            };

            this.images.push(imageData);
            this.stats.total++;
            this.stats.totalTime += processingTime;

            this.createPreviewItem(imageData);
            this.updateStats();
            this.hideLoading();

        } catch (error) {
            console.error('Error processing image:', error);
            this.hideLoading();
        }
    }

    /**
     * Remove background using AI
     */
    async removeBackground(file) {
        // Lazy load the library
        if (!window.imglyRemoveBackground) {
            await window.loadBackgroundRemovalLib();
            this.modelLoaded = true;
        }

        // Configure for speed
        const config = {
            model: 'small',  // Use small model for speed
            output: {
                format: 'image/png',
                quality: 0.8
            }
        };

        // Remove background
        const blob = await window.imglyRemoveBackground(file, config);
        return blob;
    }

    /**
     * Apply background color/transparency to removed image
     */
    async applyBackground(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        // Fill background based on setting
        if (this.settings.bgType === 'white') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (this.settings.bgType === 'color') {
            ctx.fillStyle = this.settings.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // For 'transparent', we don't fill anything

        // Draw the removed background image
        ctx.drawImage(img, 0, 0);

        return canvas.toDataURL('image/png');
    }

    /**
     * Reprocess all images with new background settings (fast - uses cached removal)
     */
    async reprocessAllImages() {
        for (const imageData of this.images) {
            // Use cached removed version for speed
            const removedImg = await this.loadImage(imageData.removedDataUrl);
            imageData.processedDataUrl = await this.applyBackground(removedImg);

            // Update preview
            const previewImg = document.querySelector(`[data-id="${imageData.id}"] .preview-image img`);
            if (previewImg) {
                previewImg.src = imageData.processedDataUrl;
            }
        }
    }

    // Helper methods
    readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Create preview item for processed image
     */
    createPreviewItem(imageData) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.id = imageData.id;

        const processingTime = (imageData.processingTime / 1000).toFixed(1);

        item.innerHTML = `
            <div class="preview-image checkered-bg">
                <img src="${imageData.processedDataUrl}" alt="${imageData.name}">
            </div>
            <div class="preview-info">
                <h4 class="preview-name" title="${imageData.name}">${this.truncateFilename(imageData.name)}</h4>
                <div class="preview-dimensions">
                    <span><i class="fas fa-expand"></i> ${imageData.width} × ${imageData.height}</span>
                    <span><i class="fas fa-bolt"></i> ${processingTime}s</span>
                </div>
                <div class="preview-actions-row">
                    <button class="btn btn-primary btn-download" data-id="${imageData.id}">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                    <button class="btn btn-outline btn-remove" data-id="${imageData.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Download button
        item.querySelector('.btn-download').addEventListener('click', () => {
            this.downloadSingle(imageData.id);
        });

        // Remove button
        item.querySelector('.btn-remove').addEventListener('click', () => {
            this.removeImage(imageData.id);
        });

        this.previewGrid.appendChild(item);
    }

    truncateFilename(name, maxLength = 20) {
        if (name.length <= maxLength) return name;
        const ext = name.split('.').pop();
        const base = name.substring(0, name.lastIndexOf('.'));
        const truncated = base.substring(0, maxLength - ext.length - 4) + '...';
        return truncated + '.' + ext;
    }

    /**
     * Download a single image
     */
    downloadSingle(id) {
        const imageData = this.images.find(img => img.id === id);
        if (!imageData) return;

        const link = document.createElement('a');
        link.href = imageData.processedDataUrl;
        const baseName = imageData.name.substring(0, imageData.name.lastIndexOf('.')) || imageData.name;
        link.download = `${baseName}_nobg.png`;
        link.click();
    }

    /**
     * Remove a single image
     */
    removeImage(id) {
        this.images = this.images.filter(img => img.id !== id);
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) item.remove();

        if (this.images.length === 0) {
            this.previewSection.classList.remove('active');
            this.settingsPanel.classList.remove('active');
            this.statsSection.classList.remove('active');
        }
    }

    /**
     * Download all images as ZIP
     */
    async downloadAll() {
        if (!this.images.length) return;

        // If single image, just download directly
        if (this.images.length === 1) {
            this.downloadSingle(this.images[0].id);
            return;
        }

        // For multiple images, create ZIP file
        this.showLoading('Creating ZIP file...', false);

        try {
            const zip = new JSZip();
            const imgFolder = zip.folder('imgkit-nobg');

            for (const imageData of this.images) {
                const baseName = imageData.name.substring(0, imageData.name.lastIndexOf('.')) || imageData.name;
                const fileName = `${baseName}_nobg.png`;

                // Convert data URL to blob
                const base64Data = imageData.processedDataUrl.split(',')[1];
                imgFolder.file(fileName, base64Data, { base64: true });
            }

            // Generate ZIP and download
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'imgkit-nobg.zip';
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('ZIP creation failed:', error);
            // Fallback to individual downloads
            this.images.forEach((imageData, index) => {
                setTimeout(() => {
                    this.downloadSingle(imageData.id);
                }, index * 300);
            });
        }

        this.hideLoading();
    }
}

// Initialize the background remover
const backgroundRemover = new BackgroundRemover();

// Tool Navigation - Switch between tools
document.querySelectorAll('.tool-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show corresponding tool section
        const tool = tab.dataset.tool;
        document.querySelectorAll('.tool-section').forEach(section => {
            section.classList.remove('active');
        });

        if (tool === 'square') {
            document.getElementById('squareTool').classList.add('active');
        } else if (tool === 'converter') {
            document.getElementById('converterTool').classList.add('active');
        } else if (tool === 'remover') {
            document.getElementById('removerTool').classList.add('active');
        }
    });
});
