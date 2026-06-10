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
            const blob = await zipEntry.async('blob');
            const cleanFilename = filename.split('/').pop();
            const ext = cleanFilename.toLowerCase().split('.').pop();
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
            const file = new File([blob], cleanFilename, { type: mimeType });
            await this.processImage(file);
        } catch (error) {
            console.error('Error extracting image from ZIP:', filename, error);
        }
    }

    async processImage(file) {
        return new Promise(async (resolve) => {
            const startTime = performance.now();
            try {
                const img = await this.loadImage(file);
                const imageData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    file: file
                };
                img.src = ''; // immediately free memory

                // Process the image
                const result = await this.convertToSquare(imageData);
                imageData.squareObjectURL = result.objectUrl;
                imageData.squareBlob = result.blob;
                imageData.squareSize = result.size;
                imageData.processingTime = performance.now() - startTime;

                this.images.push(imageData);
                this.stats.total++;
                this.stats.success++;
                this.stats.totalTime += imageData.processingTime;

                this.addPreviewItem(imageData);
                resolve();
            } catch (err) {
                console.error('Failed to load image:', file.name, err);
                resolve();
            }
        });
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(img);
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(objectUrl);
                reject(e);
            };
            img.src = objectUrl;
        });
    }

    async convertToSquare(imageData) {
        const img = await this.loadImage(imageData.file);

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

        // Immediately free decoded image
        img.src = '';

        // Get the format mime type
        const mimeType = this.getMimeType();
        const quality = this.settings.format === 'png' ? 1 : this.settings.quality;

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                // Free canvas buffer
                canvas.width = 0;
                canvas.height = 0;

                const objectUrl = URL.createObjectURL(blob);
                resolve({
                    objectUrl: objectUrl,
                    blob: blob,
                    size: canvasWidth
                });
            }, mimeType, quality);
        });
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
                <img src="${imageData.squareObjectURL}" alt="${imageData.name}" class="preview-image">
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
            if (imageData.squareObjectURL) {
                URL.revokeObjectURL(imageData.squareObjectURL);
            }

            const result = await this.convertToSquare(imageData);
            imageData.squareObjectURL = result.objectUrl;
            imageData.squareBlob = result.blob;
            imageData.squareSize = result.size;

            // Update preview
            const item = document.querySelector(`.preview-item[data-id="${imageData.id}"]`);
            if (item) {
                const img = item.querySelector('.preview-image');
                img.src = imageData.squareObjectURL;

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
        link.href = imageData.squareObjectURL;
        link.click();
    }

    removeSingle(id) {
        const imageData = this.images.find(img => img.id === id);
        if (imageData && imageData.squareObjectURL) {
            URL.revokeObjectURL(imageData.squareObjectURL);
        }
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

                // Add blob directly
                imgFolder.file(fileName, imageData.squareBlob);
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
        this.images.forEach(imageData => {
            if (imageData.squareObjectURL) {
                URL.revokeObjectURL(imageData.squareObjectURL);
            }
        });
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
            quality: 0.82 // 82% quality - visually lossless with optimal compression
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
        this.folderInput = document.getElementById('converterFolderInput');
        this.folderBtn = document.getElementById('converterFolderBtn');

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

        // Folder button click
        this.folderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.folderInput.click();
        });

        // Folder input change - filter and process only image files
        this.folderInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                this.handleFiles(files);
            }
            this.folderInput.value = '';
        });

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

                // Quality setting is always visible for all formats (lossy and lossless)
                this.qualitySetting.style.display = 'flex';

                // Update hints and default values based on selected format
                let hintText = '';
                let defaultQuality = 82;
                
                if (this.settings.format === 'webp') {
                    hintText = '(82% = Optimal for WebP)';
                    defaultQuality = 82;
                } else if (this.settings.format === 'jpg' || this.settings.format === 'jpeg') {
                    hintText = '(85% = Optimal for JPEG)';
                    defaultQuality = 85;
                } else if (this.settings.format === 'png') {
                    hintText = '(100% = Lossless, Lower = Lossy Compression)';
                    defaultQuality = 100;
                } else if (this.settings.format === 'gif') {
                    hintText = '(100% = Full Palette, Lower = Reduced Colors)';
                    defaultQuality = 100;
                } else if (this.settings.format === 'bmp') {
                    hintText = '(100% = 24-bit, Lower = Color Quantization)';
                    defaultQuality = 100;
                }
                
                const hintEl = this.qualitySetting.querySelector('.quality-hint');
                if (hintEl) {
                    hintEl.textContent = hintText;
                }

                this.settings.quality = defaultQuality / 100;
                this.qualitySlider.value = defaultQuality;
                this.qualityValue.textContent = defaultQuality;

                this.reprocessAllImages();
            });
        });

        // Quality slider - real-time debounced updates for smooth sliding
        let debounceTimer;
        this.qualitySlider.addEventListener('input', (e) => {
            this.settings.quality = e.target.value / 100;
            this.qualityValue.textContent = e.target.value;
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.reprocessAllImages(true); // Quiet mode prevents modal loading flicker
            }, 60);
        });

        this.qualitySlider.addEventListener('change', () => {
            this.reprocessAllImages(true);
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
        // Include standard image/* types AND HEIC/HEIF (which may have empty/unknown MIME in some browsers)
        const imageFiles = allFiles.filter(file => {
            if (zipFiles.includes(file)) return false;
            if (file.type.startsWith('image/')) return true;
            const lower = file.name.toLowerCase();
            return lower.endsWith('.heic') || lower.endsWith('.heif');
        });

        const total = imageFiles.length + zipFiles.length;
        let processedCount = 0;
        const startTime = performance.now();

        // Process regular image files
        for (const file of imageFiles) {
            processedCount++;
            const percent = Math.round(((processedCount - 1) / total) * 100);
            
            // Calculate time estimation
            let timeEstimateText = '';
            if (processedCount > 1) {
                const elapsed = performance.now() - startTime;
                const timePerFile = elapsed / (processedCount - 1);
                const remainingFiles = total - processedCount + 1;
                const remainingTimeMs = timePerFile * remainingFiles;
                
                if (remainingTimeMs > 1000) {
                    timeEstimateText = `<br><span style="font-size: 0.85em; opacity: 0.8;">Estimated time remaining: ${Math.round(remainingTimeMs / 1000)}s</span>`;
                } else {
                    timeEstimateText = `<br><span style="font-size: 0.85em; opacity: 0.8;">Almost done...</span>`;
                }
            }
            
            this.showLoading(`Processing image ${processedCount} of ${total}... ${percent}%${timeEstimateText}`, percent);
            await this.processImage(file);
        }

        // Extract and process images from ZIP files
        for (const zipFile of zipFiles) {
            processedCount++;
            const percent = Math.round(((processedCount - 1) / total) * 100);
            this.showLoading(`Extracting & processing ZIP ${processedCount - imageFiles.length} of ${zipFiles.length}... ${percent}%`, percent);
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
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.heic', '.heif'];

            // Get all image files from the ZIP
            const zipEntries = [];

            zip.forEach((relativePath, zipEntry) => {
                // Skip directories and hidden files
                if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.startsWith('.')) {
                    return;
                }

                // Check if it's an image file
                const lowerPath = relativePath.toLowerCase();
                const isImage = imageExtensions.some(ext => lowerPath.endsWith(ext));

                if (isImage) {
                    zipEntries.push({ entry: zipEntry, path: relativePath });
                }
            });

            // Process all images from the ZIP sequentially to avoid memory spikes
            let index = 0;
            for (const item of zipEntries) {
                index++;
                const percent = Math.round(((index - 1) / zipEntries.length) * 100);
                this.showLoading(`Extracting image ${index} of ${zipEntries.length} from ZIP... ${percent}%`, percent);
                await this.extractAndProcessImage(item.entry, item.path);
            }
        } catch (error) {
            console.error('Error processing ZIP file:', error);
        }
    }

    /**
     * Extract a single image from ZIP and process it
     */
    async extractAndProcessImage(zipEntry, filename) {
        try {
            const blob = await zipEntry.async('blob');
            const cleanFilename = filename.split('/').pop();
            const ext = cleanFilename.toLowerCase().split('.').pop();
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
            const file = new File([blob], cleanFilename, { type: mimeType });
            await this.processImage(file);
        } catch (error) {
            console.error('Error extracting image from ZIP:', filename, error);
        }
    }

    async processImage(file) {
        return new Promise(async (resolve) => {
            const startTime = performance.now();

            // HEIC/HEIF: multi-strategy conversion to prevent OOM on large files
            const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
                file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

            if (isHeic) {
                try {
                    this.showLoading(`Converting HEIC: ${file.name}... (decoding - please wait)`);
                    await new Promise(r => setTimeout(r, 100));

                    let convertedFile = null;
                    let finalWidth = 0;
                    let finalHeight = 0;

                    // ── Strategy 1: Native browser HEIC decoding via createImageBitmap ──
                    // Safari and Chrome 118+ can decode HEIC natively with much less memory
                    let nativeSuccess = false;
                    try {
                        const bitmap = await createImageBitmap(file);
                        finalWidth = bitmap.width;
                        finalHeight = bitmap.height;

                        // For very large images (>4000px), downscale to cap memory usage
                        const MAX_DIM = 4096;
                        let drawW = bitmap.width;
                        let drawH = bitmap.height;
                        if (drawW > MAX_DIM || drawH > MAX_DIM) {
                            const scale = MAX_DIM / Math.max(drawW, drawH);
                            drawW = Math.round(drawW * scale);
                            drawH = Math.round(drawH * scale);
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = drawW;
                        canvas.height = drawH;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(bitmap, 0, 0, drawW, drawH);
                        bitmap.close(); // free native bitmap memory immediately

                        const jpegBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
                        canvas.width = 0;
                        canvas.height = 0; // free canvas buffer

                        convertedFile = new File(
                            [jpegBlob],
                            file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                            { type: 'image/jpeg' }
                        );
                        finalWidth = drawW;
                        finalHeight = drawH;
                        nativeSuccess = true;
                    } catch (nativeErr) {
                        console.log('Native HEIC decode not supported, falling back to heic2any:', nativeErr.message);
                    }

                    // ── Strategy 2: Server-side conversion via sharp API (handles ANY size) ──
                    if (!nativeSuccess) {
                        try {
                            const sizeMB = Math.round(file.size / 1024 / 1024);
                            this.showLoading(`Uploading HEIC: ${file.name} (${sizeMB}MB) to server for conversion...`, 10);
                            await new Promise(r => setTimeout(r, 50));

                            let response;
                            // Vercel request limit is 4.5MB. Direct files > 4MB to Render.com.
                            const useRender = file.size > 4 * 1024 * 1024;
                            const renderUrl = 'https://imgkit-backend.onrender.com/api/convert-heic?format=jpeg&quality=92';

                            if (useRender) {
                                console.log('File > 4MB. Sending directly to Render backend...');
                                response = await fetch(renderUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/octet-stream' },
                                    body: file
                                });
                            } else {
                                try {
                                    // Try local/Vercel API first for small files
                                    response = await fetch('/api/convert-heic?format=jpeg&quality=92', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/octet-stream' },
                                        body: file
                                    });
                                    if (!response.ok) throw new Error(`Vercel failed: status ${response.status}`);
                                } catch (localErr) {
                                    console.log('Vercel API failed/unavailable, falling back to Render...');
                                    response = await fetch(renderUrl, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/octet-stream' },
                                        body: file
                                    });
                                }
                            }

                            if (!response.ok) {
                                throw new Error(`Server returned ${response.status}`);
                            }

                            this.showLoading(`Server converting ${file.name}...`, 60);
                            const convertedBlob = await response.blob();
                            finalWidth = parseInt(response.headers.get('X-Output-Width')) || 0;
                            finalHeight = parseInt(response.headers.get('X-Output-Height')) || 0;

                            convertedFile = new File(
                                [convertedBlob],
                                file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                                { type: 'image/jpeg' }
                            );

                            // If server didn't return dimensions, get them from the image
                            if (!finalWidth || !finalHeight) {
                                const tempImg = await this.loadImage(convertedFile);
                                finalWidth = tempImg.width;
                                finalHeight = tempImg.height;
                                tempImg.src = '';
                            }

                            nativeSuccess = true; // mark as success so we skip heic2any
                            this.showLoading(`Server conversion complete!`, 90);
                        } catch (serverErr) {
                            console.log('Server HEIC conversion unavailable, trying client-side:', serverErr.message);
                        }
                    }

                    // ── Strategy 3: Client-side heic2any (last resort, small files only) ──
                    if (!nativeSuccess) {
                        const HEIC_MAX_CLIENT = 15 * 1024 * 1024; // 15 MB
                        if (file.size > HEIC_MAX_CLIENT) {
                            this.hideLoading();
                            this.showHeicSizeWarning(file.name, file.size);
                            resolve();
                            return;
                        }

                        const heicQuality = file.size > 10 * 1024 * 1024 ? 0.8 : 0.92;

                        this.showLoading(`Converting HEIC: ${file.name}... (${Math.round(file.size / 1024 / 1024)}MB - client-side)`);
                        await new Promise(r => setTimeout(r, 100));

                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: 'image/jpeg',
                            quality: heicQuality
                        });

                        const actualBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

                        convertedFile = new File(
                            [actualBlob],
                            file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                            { type: 'image/jpeg' }
                        );

                        await new Promise(r => setTimeout(r, 50));
                        this.showLoading(`Loading converted image...`);
                        const tempImg = await this.loadImage(convertedFile);
                        finalWidth = tempImg.width;
                        finalHeight = tempImg.height;
                        tempImg.src = '';
                    }

                    // ── Finalize: convert to target format ──
                    await new Promise(r => setTimeout(r, 50));
                    this.showLoading(`Compressing & converting to ${this.settings.format.toUpperCase()}...`);

                    const imageData = {
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        originalFormat: 'heic',
                        originalSize: file.size,
                        width: finalWidth,
                        height: finalHeight,
                        file: convertedFile
                    };

                    const result = await this.convertImage(imageData);
                    imageData.convertedObjectURL = result.objectUrl;
                    imageData.convertedBlob = result.blob;
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
                } catch (err) {
                    console.error('HEIC conversion failed:', file.name, err);
                    resolve();
                }
                return;
            }

            // Standard image processing
            try {
                const img = await this.loadImage(file);
                const imageData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    originalFormat: this.getFormatFromMime(file.type, file.name),
                    originalSize: file.size,
                    width: img.width,
                    height: img.height,
                    file: file
                };
                img.src = ''; // Release memory

                // Convert the image
                const result = await this.convertImage(imageData);
                imageData.convertedObjectURL = result.objectUrl;
                imageData.convertedBlob = result.blob;
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
            } catch (err) {
                console.error('Failed to load image:', file.name, err);
                resolve();
            }
        });
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(img);
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(objectUrl);
                reject(e);
            };
            img.src = objectUrl;
        });
    }

    async convertImage(imageData) {
        // Use createImageBitmap for memory-efficient decoding with automatic downscaling
        const objectUrl = URL.createObjectURL(imageData.file);
        let drawSource;
        let drawW, drawH;

        try {
            // Try createImageBitmap first — much more memory efficient than <img>
            const bitmap = await createImageBitmap(imageData.file);
            drawW = bitmap.width;
            drawH = bitmap.height;

            // Cap very large images to prevent canvas OOM (max ~16MP)
            const MAX_DIM = 4096;
            if (drawW > MAX_DIM || drawH > MAX_DIM) {
                const scale = MAX_DIM / Math.max(drawW, drawH);
                drawW = Math.round(drawW * scale);
                drawH = Math.round(drawH * scale);
            }

            drawSource = bitmap;
        } catch (e) {
            // Fallback to HTMLImageElement for older browsers
            const img = await this.loadImage(imageData.file);
            drawW = img.width;
            drawH = img.height;

            const MAX_DIM = 4096;
            if (drawW > MAX_DIM || drawH > MAX_DIM) {
                const scale = MAX_DIM / Math.max(drawW, drawH);
                drawW = Math.round(drawW * scale);
                drawH = Math.round(drawH * scale);
            }

            drawSource = img;
        }

        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement('canvas');
        canvas.width = drawW;
        canvas.height = drawH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(drawSource, 0, 0, drawW, drawH);

        // Free source memory
        if (drawSource.close) drawSource.close(); // ImageBitmap
        if (drawSource.src !== undefined) drawSource.src = ''; // HTMLImageElement

        const mimeType = this.getMimeType();
        const quality = this.settings.quality;

        // Perform color quantization for png, bmp, and gif to achieve real-time size savings
        if ((this.settings.format === 'png' || this.settings.format === 'bmp' || this.settings.format === 'gif') && quality < 1.0) {
            try {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                const levels = Math.max(2, Math.round(Math.pow(quality, 1.5) * 253) + 2);
                const step = 255 / (levels - 1);
                
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.round(data[i] / step) * step;     // R
                    data[i+1] = Math.round(data[i+1] / step) * step; // G
                    data[i+2] = Math.round(data[i+2] / step) * step; // B
                }
                ctx.putImageData(imgData, 0, 0);
            } catch (err) {
                console.warn('Canvas quantization failed (possibly cross-origin or too large):', err);
            }
        }

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                // Free canvas buffer memory immediately
                canvas.width = 0;
                canvas.height = 0;

                const objectUrl = URL.createObjectURL(blob);
                resolve({
                    objectUrl: objectUrl,
                    size: blob.size,
                    blob: blob
                });
            }, mimeType, quality);
        });
    }

    getFormatFromMime(mimeType, filename = '') {
        const formats = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff',
            'image/heic': 'heic',
            'image/heif': 'heic'
        };
        let format = formats[mimeType];
        if (!format && filename) {
            const ext = filename.toLowerCase().split('.').pop();
            if (['jpg', 'jpeg'].includes(ext)) return 'jpg';
            if (['png', 'webp', 'gif', 'bmp', 'tiff', 'heic', 'heif'].includes(ext)) return ext;
        }
        return format || 'unknown';
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
                <img src="${imageData.convertedObjectURL}" alt="${imageData.name}" class="preview-image">
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

    async reprocessAllImages(isQuiet = false) {
        if (!this.images.length) return;

        if (!isQuiet) this.showLoading();

        // Reset stats for recalculation
        this.stats.totalConvertedSize = 0;

        for (const imageData of this.images) {
            // Revoke old URL first to free memory
            if (imageData.convertedObjectURL) {
                URL.revokeObjectURL(imageData.convertedObjectURL);
            }

            const result = await this.convertImage(imageData);
            imageData.convertedObjectURL = result.objectUrl;
            imageData.convertedBlob = result.blob;
            imageData.convertedSize = result.size;
            imageData.convertedFormat = this.settings.format;

            this.stats.totalConvertedSize += imageData.convertedSize;

            // Update preview
            const item = this.previewGrid.querySelector(`.preview-item[data-id="${imageData.id}"]`);
            if (item) {
                const img = item.querySelector('.preview-image');
                img.src = imageData.convertedObjectURL;

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
        if (!isQuiet) this.hideLoading();
    }

    downloadSingle(id) {
        const imageData = this.images.find(img => img.id === id);
        if (!imageData) return;

        const link = document.createElement('a');
        const baseName = imageData.name.substring(0, imageData.name.lastIndexOf('.')) || imageData.name;
        link.download = `${baseName}.${this.getFileExtension()}`;
        link.href = imageData.convertedObjectURL;
        link.click();
    }

    removeSingle(id) {
        const imageData = this.images.find(img => img.id === id);
        if (imageData) {
            if (imageData.convertedObjectURL) {
                URL.revokeObjectURL(imageData.convertedObjectURL);
            }
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

                // Add blob directly to JSZip (no base64 needed)
                imgFolder.file(fileName, imageData.convertedBlob);
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
        // Revoke all converted object URLs to free memory
        this.images.forEach(imageData => {
            if (imageData.convertedObjectURL) {
                URL.revokeObjectURL(imageData.convertedObjectURL);
            }
        });
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

    showLoading(message = 'Processing your images...', percentage = null) {
        const textEl = this.loadingOverlay.querySelector('p');
        if (textEl) {
            textEl.innerHTML = message;
        }

        let progressContainer = this.loadingOverlay.querySelector('.loading-progress-container');
        if (percentage !== null) {
            if (!progressContainer) {
                progressContainer = document.createElement('div');
                progressContainer.className = 'loading-progress-container';
                progressContainer.style.width = '240px';
                progressContainer.style.height = '6px';
                progressContainer.style.background = 'rgba(255, 255, 255, 0.15)';
                progressContainer.style.borderRadius = '3px';
                progressContainer.style.marginTop = '15px';
                progressContainer.style.overflow = 'hidden';
                progressContainer.style.position = 'relative';
                progressContainer.style.marginLeft = 'auto';
                progressContainer.style.marginRight = 'auto';

                const progressBar = document.createElement('div');
                progressBar.className = 'loading-progress-bar';
                progressBar.style.height = '100%';
                progressBar.style.width = '0%';
                progressBar.style.background = '#95BF47';
                progressBar.style.transition = 'width 0.2s ease';

                progressContainer.appendChild(progressBar);
                this.loadingOverlay.querySelector('.loading-content').appendChild(progressContainer);
            }
            const bar = progressContainer.querySelector('.loading-progress-bar');
            if (bar) {
                bar.style.width = `${percentage}%`;
            }
        } else if (progressContainer) {
            progressContainer.remove();
        }

        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        const progressContainer = this.loadingOverlay.querySelector('.loading-progress-container');
        if (progressContainer) {
            progressContainer.remove();
        }
        const textEl = this.loadingOverlay.querySelector('p');
        if (textEl) {
            textEl.textContent = 'Processing your images...';
        }
        this.loadingOverlay.classList.remove('active');
    }

    showHeicSizeWarning(fileName, fileSize) {
        const sizeMB = Math.round(fileSize / 1024 / 1024);

        // Remove any existing warning
        const existing = document.querySelector('.heic-size-warning');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'heic-size-warning';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        overlay.innerHTML = `
            <div style="
                background: #1a1a2e; border: 1px solid rgba(149,191,71,0.3);
                border-radius: 16px; padding: 32px 36px; max-width: 460px; width: 90%;
                text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                <h3 style="color: #fff; font-size: 18px; margin: 0 0 8px; font-family: 'Outfit', sans-serif;">
                    HEIC File Too Large for Browser
                </h3>
                <p style="color: #aaa; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    <strong style="color: #f0f0f0;">${fileName}</strong> is <strong style="color: #ff6b6b;">${sizeMB}MB</strong>.
                    Browser memory limits prevent HEIC decoding above ~15MB — the tab will crash.
                </p>
                <div style="
                    background: rgba(149,191,71,0.1); border: 1px solid rgba(149,191,71,0.2);
                    border-radius: 10px; padding: 14px 18px; text-align: left; margin-bottom: 20px;
                ">
                    <p style="color: #95BF47; font-size: 13px; font-weight: 600; margin: 0 0 8px;">💡 How to fix:</p>
                    <ul style="color: #ccc; font-size: 13px; line-height: 1.7; margin: 0; padding-left: 18px;">
                        <li>Convert to JPEG/PNG first using your phone's Share → Save as JPEG</li>
                        <li>On iPhone: Settings → Camera → Formats → <strong>Most Compatible</strong></li>
                        <li>Use Safari (it has native HEIC support, no size limit)</li>
                        <li>Use a smaller HEIC file (under 15MB)</li>
                    </ul>
                </div>
                <button onclick="this.closest('.heic-size-warning').remove()" style="
                    background: #95BF47; color: #000; border: none;
                    padding: 10px 32px; border-radius: 8px; font-size: 14px;
                    font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#a8d44f'" onmouseout="this.style.background='#95BF47'">
                    Got it
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Also allow clicking overlay background to dismiss
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
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

            // Show user-friendly error message
            if (error.message.includes('local server') || error.message.includes('not available')) {
                alert('⚠️ AI Background Removal requires a local server.\n\nTo use this feature:\n1. Open Terminal\n2. Navigate to ImgKit folder\n3. Run: npx serve\n4. Open the URL shown in terminal');
            } else {
                alert('Error processing image. Please try again.');
            }
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

/**
 * ImageCropper - Image Crop Tool
 * Interactive image cropping with aspect ratio presets
 */
class ImageCropper {
    constructor() {
        this.settings = {
            aspectRatio: null, // null = free, or a number like 1, 4/3, 16/9
            format: 'png',
            quality: 0.92
        };
        this.originalImage = null;
        this.fileName = '';
        // Crop region in image-pixel coordinates
        this.crop = { x: 0, y: 0, w: 0, h: 0 };
        // Display metrics
        this.imgRect = null; // bounding rect of the displayed image
        this.scale = 1; // display pixels → real pixels

        this.dragging = null; // null | 'move' | handle name
        this.dragStart = { mx: 0, my: 0, crop: null };

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.uploadSection = document.getElementById('cropperUploadSection');
        this.uploadArea = document.getElementById('cropperUploadArea');
        this.fileInput = document.getElementById('cropperFileInput');
        this.workspace = document.getElementById('cropWorkspace');
        this.canvasContainer = document.getElementById('cropCanvasContainer');
        this.sourceImage = document.getElementById('cropSourceImage');
        this.overlay = document.getElementById('cropOverlay');
        this.selection = document.getElementById('cropSelection');
        this.dimensionsEl = document.getElementById('cropDimensions');
        this.resetBtn = document.getElementById('cropResetBtn');
        this.newImageBtn = document.getElementById('cropNewImageBtn');
        this.settingsPanel = document.getElementById('cropperSettingsPanel');
        this.aspectToggle = document.getElementById('cropAspectToggle');
        this.formatToggle = document.getElementById('cropFormatToggle');
        this.qualitySetting = document.getElementById('cropQualitySetting');
        this.qualitySlider = document.getElementById('cropQualitySlider');
        this.qualityValue = document.getElementById('cropQualityValue');
        this.applyBtn = document.getElementById('cropApplyBtn');
    }

    initEventListeners() {
        // Upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.loadImage(e.target.files[0]);
        });

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
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) this.loadImage(file);
        });

        // Paste
        document.addEventListener('paste', (e) => {
            if (!document.getElementById('cropperTool').classList.contains('active')) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    this.loadImage(item.getAsFile());
                    return;
                }
            }
        });

        // Crop interaction — mouse
        this.selection.addEventListener('mousedown', (e) => this.onSelectionDown(e));
        this.selection.querySelectorAll('.crop-handle').forEach(h => {
            h.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.onHandleDown(e, h.dataset.handle);
            });
        });
        document.addEventListener('mousemove', (e) => this.onPointerMove(e));
        document.addEventListener('mouseup', () => this.onPointerUp());

        // Crop interaction — touch
        this.selection.addEventListener('touchstart', (e) => this.onSelectionDown(e.touches[0], true), { passive: false });
        this.selection.querySelectorAll('.crop-handle').forEach(h => {
            h.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this.onHandleDown(e.touches[0], h.dataset.handle, true);
            }, { passive: false });
        });
        document.addEventListener('touchmove', (e) => {
            if (this.dragging) { e.preventDefault(); this.onPointerMove(e.touches[0]); }
        }, { passive: false });
        document.addEventListener('touchend', () => this.onPointerUp());

        // Toolbar
        this.resetBtn.addEventListener('click', () => this.resetCrop());
        this.newImageBtn.addEventListener('click', () => this.showUpload());

        // Aspect ratio
        this.aspectToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.aspectToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const v = btn.dataset.value;
                if (v === 'free') {
                    this.settings.aspectRatio = null;
                } else {
                    const [w, h] = v.split(':').map(Number);
                    this.settings.aspectRatio = w / h;
                }
                if (this.originalImage) this.applyAspectRatio();
            });
        });

        // Format
        this.formatToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.formatToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.format = btn.dataset.value;
                this.qualitySetting.style.display = (this.settings.format === 'png') ? 'none' : 'flex';
            });
        });

        // Quality
        this.qualitySlider.addEventListener('input', (e) => {
            this.settings.quality = e.target.value / 100;
            this.qualityValue.textContent = e.target.value;
        });

        // Apply
        this.applyBtn.addEventListener('click', () => this.applyCropAndDownload());

        // Re-calculate on resize
        window.addEventListener('resize', () => {
            if (this.originalImage) {
                requestAnimationFrame(() => this.syncOverlay());
            }
        });
    }

    /* ─── Image Loading ─── */
    loadImage(file) {
        this.fileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.sourceImage.src = e.target.result;
                this.sourceImage.onload = () => {
                    this.uploadSection.style.display = 'none';
                    this.workspace.classList.add('active');
                    this.settingsPanel.classList.add('active');
                    this.resetCrop();
                };
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        this.fileInput.value = '';
    }

    showUpload() {
        this.workspace.classList.remove('active');
        this.settingsPanel.classList.remove('active');
        this.uploadSection.style.display = '';
        this.originalImage = null;
    }

    /* ─── Geometry helpers ─── */
    syncOverlay() {
        // The image may be letter-boxed inside the container
        const imgEl = this.sourceImage;
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const imgNatW = this.originalImage.width;
        const imgNatH = this.originalImage.height;

        // Rendered size of the image (object-fit: contain)
        const containerW = containerRect.width;
        const containerH = containerRect.height;
        const scaleX = containerW / imgNatW;
        const scaleY = containerH / imgNatH;
        const s = Math.min(scaleX, scaleY);
        const renderedW = imgNatW * s;
        const renderedH = imgNatH * s;
        const offsetX = (containerW - renderedW) / 2;
        const offsetY = (containerH - renderedH) / 2;

        this.imgRect = { x: offsetX, y: offsetY, w: renderedW, h: renderedH };
        this.scale = s;
        this.renderSelection();
    }

    renderSelection() {
        if (!this.imgRect) return;
        const s = this.scale;
        const ox = this.imgRect.x;
        const oy = this.imgRect.y;
        this.selection.style.left = (ox + this.crop.x * s) + 'px';
        this.selection.style.top = (oy + this.crop.y * s) + 'px';
        this.selection.style.width = (this.crop.w * s) + 'px';
        this.selection.style.height = (this.crop.h * s) + 'px';

        // Update dimensions display (real pixels)
        this.dimensionsEl.textContent = `${Math.round(this.crop.w)} × ${Math.round(this.crop.h)}`;
    }

    resetCrop() {
        if (!this.originalImage) return;
        const ar = this.settings.aspectRatio;
        const imgW = this.originalImage.width;
        const imgH = this.originalImage.height;

        if (!ar) {
            this.crop = { x: 0, y: 0, w: imgW, h: imgH };
        } else {
            // Fit aspect ratio inside image
            let w = imgW, h = imgW / ar;
            if (h > imgH) { h = imgH; w = imgH * ar; }
            this.crop = { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
        }
        this.syncOverlay();
    }

    applyAspectRatio() {
        const ar = this.settings.aspectRatio;
        if (!ar) return;
        const imgW = this.originalImage.width;
        const imgH = this.originalImage.height;
        // Shrink current crop to fit aspect ratio, keep centered on current center
        let cx = this.crop.x + this.crop.w / 2;
        let cy = this.crop.y + this.crop.h / 2;
        let w = this.crop.w;
        let h = w / ar;
        if (h > this.crop.h) { h = this.crop.h; w = h * ar; }
        // Clamp to image bounds
        if (w > imgW) { w = imgW; h = w / ar; }
        if (h > imgH) { h = imgH; w = h * ar; }
        let x = cx - w / 2;
        let y = cy - h / 2;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + w > imgW) x = imgW - w;
        if (y + h > imgH) y = imgH - h;
        this.crop = { x, y, w, h };
        this.renderSelection();
    }

    /* ─── Pointer interaction ─── */
    onSelectionDown(e, isTouch) {
        if (isTouch) e.preventDefault?.();
        this.dragging = 'move';
        this.dragStart = {
            mx: e.clientX, my: e.clientY,
            crop: { ...this.crop }
        };
    }

    onHandleDown(e, handle, isTouch) {
        if (isTouch) e.preventDefault?.();
        this.dragging = handle;
        this.dragStart = {
            mx: e.clientX, my: e.clientY,
            crop: { ...this.crop }
        };
    }

    onPointerMove(e) {
        if (!this.dragging || !this.imgRect) return;
        const dx = (e.clientX - this.dragStart.mx) / this.scale;
        const dy = (e.clientY - this.dragStart.my) / this.scale;
        const oc = this.dragStart.crop;
        const imgW = this.originalImage.width;
        const imgH = this.originalImage.height;
        const minSize = 20;

        if (this.dragging === 'move') {
            let nx = oc.x + dx;
            let ny = oc.y + dy;
            nx = Math.max(0, Math.min(imgW - oc.w, nx));
            ny = Math.max(0, Math.min(imgH - oc.h, ny));
            this.crop.x = nx;
            this.crop.y = ny;
        } else {
            // Handle resize
            let { x, y, w, h } = oc;
            const handle = this.dragging;

            // Adjust edges based on handle
            if (handle.includes('e')) { w = Math.max(minSize, oc.w + dx); }
            if (handle.includes('w')) { w = Math.max(minSize, oc.w - dx); x = oc.x + oc.w - w; }
            if (handle.includes('s')) { h = Math.max(minSize, oc.h + dy); }
            if (handle.includes('n')) { h = Math.max(minSize, oc.h - dy); y = oc.y + oc.h - h; }

            // Aspect ratio constraint
            const ar = this.settings.aspectRatio;
            if (ar) {
                if (handle === 'n' || handle === 's') {
                    w = h * ar;
                    x = oc.x + (oc.w - w) / 2;
                } else if (handle === 'e' || handle === 'w') {
                    h = w / ar;
                    y = oc.y + (oc.h - h) / 2;
                } else {
                    // Corner — base on the axis with larger movement
                    if (Math.abs(dx) > Math.abs(dy)) {
                        h = w / ar;
                        if (handle.includes('n')) y = oc.y + oc.h - h;
                    } else {
                        w = h * ar;
                        if (handle.includes('w')) x = oc.x + oc.w - w;
                    }
                }
            }

            // Clamp to image bounds
            if (x < 0) { w += x; x = 0; }
            if (y < 0) { h += y; y = 0; }
            if (x + w > imgW) w = imgW - x;
            if (y + h > imgH) h = imgH - y;
            if (w < minSize) w = minSize;
            if (h < minSize) h = minSize;

            this.crop = { x, y, w, h };
        }

        this.renderSelection();
    }

    onPointerUp() {
        this.dragging = null;
    }

    /* ─── Export ─── */
    applyCropAndDownload() {
        if (!this.originalImage) return;
        const { x, y, w, h } = this.crop;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.originalImage, Math.round(x), Math.round(y), Math.round(w), Math.round(h), 0, 0, Math.round(w), Math.round(h));

        const mimeTypes = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
        const mime = mimeTypes[this.settings.format] || 'image/png';
        const quality = this.settings.format === 'png' ? 1 : this.settings.quality;
        const dataUrl = canvas.toDataURL(mime, quality);

        const link = document.createElement('a');
        const ext = this.settings.format === 'jpeg' ? 'jpg' : this.settings.format;
        const baseName = this.fileName.substring(0, this.fileName.lastIndexOf('.')) || this.fileName;
        link.download = `${baseName}_cropped.${ext}`;
        link.href = dataUrl;
        link.click();
    }
}

// Initialize the cropper
const imageCropper = new ImageCropper();

/**
 * FaviconGenerator - Tool to generate favicons for all platforms
 */
class FaviconGenerator {
    constructor() {
        this.originalImage = null;
        this.fileName = '';
        this.generatedAssets = [];
        this.sizes = [
            { size: 16, name: 'favicon-16x16.png', label: 'Standard' },
            { size: 32, name: 'favicon-32x32.png', label: 'Standard' },
            { size: 48, name: 'favicon-48x48.png', label: 'Legacy' },
            { size: 180, name: 'apple-touch-icon.png', label: 'Apple Touch' },
            { size: 192, name: 'android-chrome-192x192.png', label: 'Android' },
            { size: 512, name: 'android-chrome-512x512.png', label: 'Android' }
        ];

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.uploadArea = document.getElementById('faviconUploadArea');
        this.fileInput = document.getElementById('faviconFileInput');
        this.settingsPanel = document.getElementById('faviconSettingsPanel');
        this.baseNameInput = document.getElementById('faviconBaseName');
        this.codeBlock = document.getElementById('faviconCodeBlock');
        this.previewSection = document.getElementById('faviconPreviewSection');
        this.previewGrid = document.getElementById('faviconPreviewGrid');
        this.clearAllBtn = document.getElementById('faviconClearAll');
        this.downloadAllBtn = document.getElementById('faviconDownloadAll');
        this.copyHtmlBtn = document.getElementById('copyHtmlBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initEventListeners() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        this.uploadArea.addEventListener('dragleave', () => this.uploadArea.classList.remove('drag-over'));
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFile(e.dataTransfer.files[0]);
        });

        this.baseNameInput.addEventListener('input', () => this.updateHtmlSnippet());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.downloadAllBtn.addEventListener('click', () => this.downloadZip());
        this.copyHtmlBtn.addEventListener('click', () => this.copyHtml());
    }

    async handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        this.fileName = file.name;
        
        this.showLoading();
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                this.originalImage = img;
                await this.generateAll();
                this.settingsPanel.classList.add('active');
                this.previewSection.classList.add('active');
                this.updateHtmlSnippet();
                this.hideLoading();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async generateAll() {
        this.generatedAssets = [];
        this.previewGrid.innerHTML = '';
        
        for (const item of this.sizes) {
            const dataUrl = await this.resizeImage(item.size);
            const asset = { ...item, dataUrl };
            this.generatedAssets.push(asset);
            this.addPreviewItem(asset);
        }
    }

    resizeImage(size) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Draw image with high quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // If image is not square, center and cover
            const img = this.originalImage;
            const ar = img.width / img.height;
            let dw, dh, dx, dy;
            
            if (ar > 1) {
                dh = size;
                dw = size * ar;
                dx = (size - dw) / 2;
                dy = 0;
            } else {
                dw = size;
                dh = size / ar;
                dx = 0;
                dy = (size - dh) / 2;
            }
            
            ctx.drawImage(img, dx, dy, dw, dh);
            resolve(canvas.toDataURL('image/png'));
        });
    }

    addPreviewItem(asset) {
        const item = document.createElement('div');
        item.className = 'favicon-item';
        item.innerHTML = `
            <div class="favicon-icon-wrapper">
                <img src="${asset.dataUrl}" alt="${asset.name}">
            </div>
            <div class="favicon-size-label">${asset.size}x${asset.size}</div>
            <div class="favicon-name-label">${asset.name}</div>
        `;
        this.previewGrid.appendChild(item);
    }

    updateHtmlSnippet() {
        const base = this.baseNameInput.value || 'favicon';
        const snippet = `<!-- Favicon configuration -->
<link rel="icon" type="image/png" sizes="16x16" href="/${base}-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/${base}-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
        
        this.codeBlock.querySelector('code').textContent = snippet;
    }

    async downloadZip() {
        const zip = new JSZip();
        const base = this.baseNameInput.value || 'favicon';
        
        this.generatedAssets.forEach(asset => {
            let finalName = asset.name;
            if (asset.name.includes('favicon-')) {
                finalName = asset.name.replace('favicon', base);
            }
            const base64 = asset.dataUrl.split(',')[1];
            zip.file(finalName, base64, { base64: true });
        });

        // Add manifest.json
        const manifest = {
            name: "ImgKit Generated App",
            short_name: "ImgKit",
            icons: [
                { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
                { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
            ],
            theme_color: "#ffffff",
            background_color: "#ffffff",
            display: "standalone"
        };
        zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

        // Add index.html snippet
        zip.file('favicon-instructions.html', `<!-- Paste this into your <head> tag -->\n\n${this.codeBlock.querySelector('code').textContent}`);

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'favicon_bundle.zip';
        link.click();
    }

    async copyHtml() {
        try {
            await navigator.clipboard.writeText(this.codeBlock.querySelector('code').textContent);
            const btn = this.copyHtmlBtn;
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => btn.innerHTML = originalIcon, 2000);
        } catch (err) {
            console.error('Failed to copy code');
        }
    }

    clearAll() {
        this.originalImage = null;
        this.previewGrid.innerHTML = '';
        this.settingsPanel.classList.remove('active');
        this.previewSection.classList.remove('active');
        this.fileInput.value = '';
    }

    showLoading() { this.loadingOverlay.classList.add('active'); }
    hideLoading() { this.loadingOverlay.classList.remove('active'); }
}

/**
 * ImageTrimmer - Auto-trim transparent/solid borders
 */
class ImageTrimmer {
    constructor() {
        this.originalImage = null;
        this.fileName = '';
        this.trimmedDataUrl = null;
        
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.uploadArea = document.getElementById('trimmerUploadArea');
        this.fileInput = document.getElementById('trimmerFileInput');
        this.settingsPanel = document.getElementById('trimmerSettingsPanel');
        this.previewSection = document.getElementById('trimmerPreviewSection');
        this.canvas = document.getElementById('trimPreviewCanvas');
        this.toleranceSlider = document.getElementById('trimToleranceSlider');
        this.toleranceValue = document.getElementById('trimToleranceValue');
        this.colorTypeToggle = document.getElementById('trimColorTypeToggle');
        this.applyBtn = document.getElementById('trimApplyBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.ctx = this.canvas.getContext('2d');
    }

    initEventListeners() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        this.uploadArea.addEventListener('dragleave', () => this.uploadArea.classList.remove('drag-over'));
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFile(e.dataTransfer.files[0]);
        });

        this.toleranceSlider.addEventListener('input', (e) => {
            this.toleranceValue.textContent = e.target.value;
        });
        this.toleranceSlider.addEventListener('change', () => this.processTrim());
        
        this.colorTypeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.colorTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.processTrim();
            });
        });

        this.applyBtn.addEventListener('click', () => this.downloadResult());
    }

    async handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        this.fileName = file.name;
        
        this.showLoading();
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.settingsPanel.classList.add('active');
                this.previewSection.classList.add('active');
                this.processTrim();
                this.hideLoading();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async processTrim() {
        if (!this.originalImage) return;
        
        const img = this.originalImage;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        const tolerance = parseInt(this.toleranceSlider.value);
        const mode = this.colorTypeToggle.querySelector('.active').dataset.value;
        
        // Pick reference color (top-left pixel)
        const ref = { r: data[0], g: data[1], b: data[2], a: data[3] };
        
        const isMatch = (index) => {
            if (mode === 'transparent') return data[index + 3] <= tolerance;
            
            const r = data[index], g = data[index+1], b = data[index+2], a = data[index+3];
            // If reference is transparent, match transparency
            if (ref.a <= 10) return a <= tolerance;
            
            // Color matching with tolerance
            return Math.abs(r - ref.r) <= tolerance &&
                   Math.abs(g - ref.g) <= tolerance &&
                   Math.abs(b - ref.b) <= tolerance;
        };

        let minX = tempCanvas.width, minY = tempCanvas.height, maxX = 0, maxY = 0;
        let found = false;

        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const i = (y * tempCanvas.width + x) * 4;
                if (!isMatch(i)) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (!found) {
            // Nothing to trim or everything matches
            this.renderTrim(img, 0, 0, img.width, img.height);
            return;
        }

        // Add 1px padding
        minX = Math.max(0, minX - 1);
        minY = Math.max(0, minY - 1);
        maxX = Math.min(tempCanvas.width - 1, maxX + 1);
        maxY = Math.min(tempCanvas.height - 1, maxY + 1);

        const trimW = maxX - minX + 1;
        const trimH = maxY - minY + 1;
        
        this.renderTrim(img, minX, minY, trimW, trimH);
    }

    renderTrim(img, x, y, w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        this.trimmedDataUrl = this.canvas.toDataURL('image/png');
    }

    downloadResult() {
        if (!this.trimmedDataUrl) return;
        const link = document.createElement('a');
        const baseName = this.fileName.substring(0, this.fileName.lastIndexOf('.')) || this.fileName;
        link.download = `${baseName}_trimmed.png`;
        link.href = this.trimmedDataUrl;
        link.click();
    }

    showLoading() { this.loadingOverlay.classList.add('active'); }
    hideLoading() { this.loadingOverlay.classList.remove('active'); }
}

/**
 * ImageOCR - Optical Character Recognition
 * Extracts text from images using Tesseract.js
 */
class ImageOCR {
    constructor() {
        this.worker = null;
        this.isProcessing = false;
        this.currentImage = null;
        this.settings = {
            lang: 'eng',
            autoContrast: true
        };

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.uploadArea = document.getElementById('ocrUploadArea');
        this.fileInput = document.getElementById('ocrFileInput');
        this.langSelect = document.getElementById('ocrLanguage');
        this.autoContrastCheck = document.getElementById('ocrAutoContrast');
        
        this.progressContainer = document.getElementById('ocrProgressContainer');
        this.statusText = document.getElementById('ocrStatusText');
        this.progressValue = document.getElementById('ocrProgressValue');
        this.progressFill = document.getElementById('ocrProgressFill');
        
        this.resultSection = document.getElementById('ocrResultSection');
        this.resultText = document.getElementById('ocrResultText');
        this.copyBtn = document.getElementById('copyOcrText');
        this.downloadBtn = document.getElementById('downloadOcrText');
        
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initEventListeners() {
        // Upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        this.uploadArea.addEventListener('dragleave', () => this.uploadArea.classList.remove('drag-over'));
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Paste
        document.addEventListener('paste', (e) => {
            const ocrTool = document.getElementById('ocrTool');
            if (ocrTool && ocrTool.classList.contains('active')) {
                this.handlePaste(e);
            }
        });

        // Language change
        this.langSelect.addEventListener('change', (e) => {
            this.settings.lang = e.target.value;
            if (this.currentImage) this.processOCR();
        });

        // Auto contrast change
        this.autoContrastCheck.addEventListener('change', (e) => {
            this.settings.autoContrast = e.target.checked;
            if (this.currentImage) this.processOCR();
        });

        // Actions
        this.copyBtn.addEventListener('click', () => this.copyResult());
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
    }

    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) this.handleFiles([file]);
                break;
            }
        }
    }

    async handleFiles(files) {
        if (!files.length) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return;

        this.currentImage = file;
        this.processOCR();
    }

    async processOCR() {
        if (this.isProcessing || !this.currentImage) return;
        this.isProcessing = true;

        this.resultSection.style.display = 'none';
        this.progressContainer.style.display = 'block';
        this.updateProgress(0, 'Initializing advanced OCR engine...');

        try {
            // Load and Preprocess
            const imagePtr = await this.loadImage(this.currentImage);
            let processedImage = imagePtr;

            if (this.settings.autoContrast) {
                this.updateProgress(5, 'Applying adaptive thresholding for high accuracy...');
                processedImage = await this.applyPreprocessing(imagePtr);
            }

            // Perform OCR
            this.updateProgress(10, 'Performing intelligent layout analysis...');
            
            // PSM 1: Automatic page segmentation with OSD. 
            // Important for multi-column detection.
            const result = await Tesseract.recognize(
                processedImage,
                this.settings.lang,
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            this.updateProgress(10 + (m.progress * 85), `Extracting structure & data...`);
                        }
                    }
                }
            );

            this.updateProgress(95, 'Finalizing structural reconstruction...');
            const structuredText = this.reconstructLayout(result.data);
            this.showResult(structuredText);

        } catch (error) {
            console.error('OCR Error:', error);
            this.statusText.textContent = 'Error: ' + error.message;
            this.statusText.style.color = 'var(--error-color)';
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Reconstructs text layout using a grid-based spatial mapper
     * Handles multiple columns and precise spacing
     */
    reconstructLayout(data) {
        if (!data.lines || data.lines.length === 0) return data.text;

        // 1. Spatial Sorting & Column Detection
        // Sort lines primarily by Y (vertical), then X (horizontal)
        const sortedLines = [...data.lines].sort((a, b) => {
            const yDiff = a.bbox.y0 - b.bbox.y0;
            if (Math.abs(yDiff) < 10) return a.bbox.x0 - b.bbox.x0; // Roughly same line
            return yDiff;
        });

        // Group lines into rows based on vertical overlap
        const rows = [];
        let currentRow = [];
        let prevY = -1;

        sortedLines.forEach(line => {
            if (prevY === -1 || Math.abs(line.bbox.y0 - prevY) < 15) {
                currentRow.push(line);
            } else {
                // Sort current row by X before adding
                currentRow.sort((a, b) => a.bbox.x0 - b.bbox.x0);
                rows.push(currentRow);
                currentRow = [line];
            }
            prevY = line.bbox.y0;
        });
        if (currentRow.length > 0) {
            currentRow.sort((a, b) => a.bbox.x0 - b.bbox.x0);
            rows.push(currentRow);
        }

        // 2. Grid Reconstruction
        let output = "";
        
        // Estimate character width based on average
        let totalChars = 0;
        let totalWidth = 0;
        data.lines.forEach(line => {
            const textLen = line.text.trim().length;
            if (textLen > 0) {
                totalChars += textLen;
                totalWidth += (line.bbox.x1 - line.bbox.x0);
            }
        });
        const charWidth = totalChars > 0 ? (totalWidth / totalChars) : 10;

        rows.forEach(row => {
            let currentX = 0;
            row.forEach((line, lineIdx) => {
                const targetX = line.bbox.x0;
                const spacesNeeded = Math.max(0, Math.floor((targetX - currentX) / charWidth));
                
                // If this is the start of a column skip, add extra buffer
                const leadSpace = lineIdx > 0 ? "    " : " ".repeat(spacesNeeded);
                output += (lineIdx > 0 ? "    " : " ".repeat(spacesNeeded));
                
                // Track word-by-word within the line block for pricing dots/gaps
                let wordX = targetX;
                line.words.forEach((word, wordIdx) => {
                    const gap = word.bbox.x0 - wordX;
                    if (gap > charWidth * 2) {
                        const gapSpaces = Math.floor(gap / charWidth);
                        output += " ".repeat(gapSpaces);
                    } else if (wordIdx > 0) {
                        output += " ";
                    }
                    
                    output += word.text;
                    wordX = word.bbox.x1;
                });
                
                currentX = line.bbox.x1;
            });
            output += "\n";
        });

        return output;
    }

    loadImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Advanced Adaptive Thresholding (Bradley-Roth Algorithm)
     * Handles variable lighting and background gradients perfectly
     */
    async applyPreprocessing(imageSrc) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const w = canvas.width;
                const h = canvas.height;

                // 1. Create Grayscale Buffer
                const grayscale = new Uint8Array(w * h);
                for (let i = 0; i < data.length; i += 4) {
                    grayscale[i/4] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                }

                // 2. Create Integral Image for fast local mean calculation
                const integral = new Int32Array(w * h);
                for (let x = 0; x < w; x++) {
                    let sum = 0;
                    for (let y = 0; y < h; y++) {
                        sum += grayscale[y * w + x];
                        if (x === 0) integral[y * w + x] = sum;
                        else integral[y * w + x] = integral[y * w + x - 1] + sum;
                    }
                }

                // 3. Adaptive Decision
                const s = Math.floor(w / 8); // Window size
                const t = 15; // Threshold percentage

                for (let x = 0; x < w; x++) {
                    for (let y = 0; y < h; y++) {
                        const x1 = Math.max(0, x - s/2);
                        const x2 = Math.min(w - 1, x + s/2);
                        const y1 = Math.max(0, y - s/2);
                        const y2 = Math.min(h - 1, y + s/2);
                        
                        const count = (x2 - x1) * (y2 - y1);
                        let sum = integral[y2 * w + x2];
                        if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * w + (x1 - 1)];
                        if (x1 > 0) sum -= integral[y2 * w + (x1 - 1)];
                        if (y1 > 0) sum -= integral[(y1 - 1) * w + x2];

                        const pixelIndex = (y * w + x) * 4;
                        const isBlack = (grayscale[y * w + x] * count) < (sum * (100 - t) / 100);
                        
                        const color = isBlack ? 0 : 255;
                        data[pixelIndex] = data[pixelIndex+1] = data[pixelIndex+2] = color;
                        data[pixelIndex+3] = 255;
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageSrc;
        });
    }

    updateProgress(percent, status) {
        const p = Math.round(percent);
        this.progressFill.style.width = `${p}%`;
        this.progressValue.textContent = `${p}%`;
        this.statusText.textContent = status;
    }

    showResult(text) {
        this.progressContainer.style.display = 'none';
        this.resultSection.style.display = 'block';
        this.resultText.value = text.trim();
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    copyResult() {
        const text = this.resultText.value;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            const originalText = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.copyBtn.classList.add('btn-success');
            setTimeout(() => {
                this.copyBtn.innerHTML = originalText;
                this.copyBtn.classList.remove('btn-success');
            }, 2000);
        });
    }

    downloadResult() {
        const text = this.resultText.value;
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = this.currentImage ? this.currentImage.name.split('.')[0] : 'extracted_text';
        link.download = `${fileName}_ocr.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }
}


// Initialize tools
const faviconGen = new FaviconGenerator();
const imageTrimmer = new ImageTrimmer();
const imageOCR = new ImageOCR();

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
        } else if (tool === 'cropper') {
            document.getElementById('cropperTool').classList.add('active');
        } else if (tool === 'favicon') {
            document.getElementById('faviconTool').classList.add('active');
        } else if (tool === 'trimmer') {
            document.getElementById('trimmerTool').classList.add('active');
        } else if (tool === 'ocr') {
            document.getElementById('ocrTool').classList.add('active');
        }
    });
});
