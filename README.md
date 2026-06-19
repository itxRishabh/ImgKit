<p align="center">
  <img src="https://img.icons8.com/fluency/96/crop.png" alt="ImgKit Logo" width="80" height="80">
</p>

<h1 align="center">ImgKit</h1>

<p align="center">
  <strong>Your All-in-One Free Online Image Toolkit</strong>
</p>

<p align="center">
  <a href="#-tools">Tools</a> •
  <a href="#-features">Features</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/Made%20with-❤️-red.svg" alt="Made with Love">
</p>

---

## 🛠️ Tools

### 1. Square Maker
Transform any image into a perfect 1:1 square format without cropping or stretching. Ideal for social media profiles, product photos, and thumbnails.

**Background Options:**
| Option | Description |
|--------|-------------|
| 🎨 **Solid Color** | Choose from presets or pick a custom color |
| ♟️ **Transparent** | Perfect for PNG outputs with no background |
| � **Blur Extend** | Extends edges with a beautiful blur effect |
| ✨ **Smart Extend (AI)** | Intelligently samples and extends image edges for seamless results |

**Output Options:**
- **Auto (1:1)** - Automatically creates square based on largest dimension
- **Custom Size** - Set exact width × height with optional linked aspect ratio
- **Format** - Export as PNG, JPG, or WebP
- **Quality Control** - Adjustable quality slider for JPG/WebP

---

### 2. Format Converter
Convert images between popular formats with zero quality loss. Optimized for file size reduction.

**Supported Formats:**

| Format | Input | Output | Notes |
|--------|:-----:|:------:|-------|
| PNG | ✅ | ✅ | Lossless, larger file size |
| JPG | ✅ | ✅ | Lossy, adjustable quality |
| WebP | ✅ | ✅ | Best compression, modern format |
| GIF | ✅ | ✅ | Limited colors, animation support |
| BMP | ✅ | ✅ | Uncompressed bitmap |
| TIFF | ✅ | — | Input only |

**Features:**
- Real-time file size comparison
- Percentage saved/increased indicator
- Lossless mode at 100% quality
- Batch processing support

---

### 3. AI Background Remover 🆕
Remove image backgrounds instantly using AI. Works 100% locally in your browser.

**Features:**

| Feature | Description |
|---------|-------------|
| 🧠 **AI-Powered** | Uses machine learning for precise edge detection |
| 🏃 **Fast Processing** | Model loads once, then processes images rapidly |
| 🎨 **Background Options** | Transparent, white, or custom color |
| 🔒 **100% Private** | AI runs locally - images never leave your device |
| 📦 **Batch Support** | Process multiple images at once |

**How it works:**
1. Upload images (drag & drop, click, or paste)
2. AI automatically detects and removes backgrounds
3. Choose background type (transparent/white/color)
4. Download individual images or all as ZIP

---

### 4. Image Crop ✂️
Precise image cropping with interactive selection and aspect ratio presets.

**Features:**

| Feature | Description |
|---------|-------------|
| 🖱️ **Interactive Crop** | Drag to move, handles to resize the crop area |
| 📐 **Aspect Ratios** | Free, 1:1, 4:3, 3:2, 16:9, 9:16 presets |
| 📏 **Live Dimensions** | Real-time pixel dimensions display |
| 🎯 **Rule of Thirds** | Grid overlay for better composition |
| 📱 **Touch Support** | Works on mobile and tablet devices |

**How it works:**
1. Upload an image (drag & drop, click, or paste)
2. Adjust the crop selection by dragging corners/edges
3. Choose an aspect ratio preset (optional)
4. Select output format (PNG/JPG/WebP) and quality
5. Click "Apply Crop & Download"

---

### 5. SEO Audit Tool 🚀
Analyze any website's SEO health with a comprehensive, professional-grade auditing engine. Find critical errors, warnings, and optimize search index visibility instantly.

**Features:**
- 📊 **Weighted Scoring Engine** - 0-100 score dynamic circular visualizer gauge.
- 🏷️ **Meta Tags & Indexing** - Validates Title tags, descriptions, robot instructions, and canonicals.
- 📐 **Semantic Hierarchy** - Inspects heading trees (`H1`, `H2`, `H3`) and flags structure imbalances.
- 🔒 **Security Headers Check** - Scans for HTTPS SSL encryption and key protection headers (CSP, HSTS, X-Frame-Options, Referrer-Policy).
- 🔗 **Link Profile Scrubber** - Reports internal/external link maps and flags dead/empty anchors.
- 🖼️ **Image Accessibility** - Audits missing alt attributes across image libraries.
- ⚙️ **Technical & Schema Check** - Verifies JSON-LD structured schemas, Open Graph sharing cards, and crawl directives (`robots.txt`, `sitemap.xml`).
- 📄 **Export PDF Reports** - Print-optimized layout converter compiling all details, branded under the ImgKit ecosystem and credits.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **Lightning Fast** | All image processing happens locally in your browser |
| 🔍 **Full SEO Audits** | Scrapes and rates external websites for metadata, hierarchy, and tags |
| 🔒 **100% Private** | Your images never leave your device (AI runs local in-browser) |
| 🧠 **AI Background Removal** | Remove backgrounds with native machine learning |
| ✂️ **Image Crop** | Interactive cropping with aspect ratio presets |
| 📄 **PDF Export Report** | Beautiful, print-ready formal PDF exports with dynamic accordion unfolding |
| 📦 **Batch Processing** | Process multiple images at once |
| 💾 **Quality Control** | Full control over output quality (10-100%) |
| 🆓 **Free Forever** | No sign-up, no limits, completely free |

---

## 🚀 Usage

ImgKit includes both browser-based image tools and a server-proxied SEO Auditor. To run the complete application suite locally:

### 📦 Setup & Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/itxRishabh/ImgKit.git
   cd ImgKit
   ```
2. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```
4. Open the application:
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

### How to Use
- **Image Tools**: Select Square Maker, Format Converter, Remove BG, or Image Crop, upload files, customize output settings, and download.
- **SEO Audit**: Click the **SEO Audit** link in the header, input a website URL (including `https://`), and review the live metrics dashboard. Click **Download PDF Report** to export a physical layout copy of the report.

---

## 🔧 Tech Stack

- **HTML5 & CSS3** - Semantic markup structure & modern glassmorphism styling
- **JavaScript (ES6+)** - Core application logic & DOM parsing audit engine
- **Node.js & Express** - Backend server routes and serverless APIs to fetch and proxy site contents bypassing CORS
- **Canvas API** - In-browser local image processing
- **@imgly/background-removal** - WebAssembly local browser-based AI model for background removal
- **JSZip** - Dynamic zip file generator for batch conversions
- **Font Awesome 6 & Google Fonts** - Inter typography and modern icon library

---

## 📁 Project Structure

```
ImgKit/
├── api/
│   └── seo-audit.js  # Serverless backend function for Vercel deploy
├── index.html        # Main dashboard panel (Image Tools)
├── seo-audit.html    # Standalone SEO Auditor page
├── seo-audit.css     # Dedicated print/screen SEO audit styles
├── seo-audit.js      # Core SEO parsing & scoring engine
├── app.js            # Image tools client engine
├── server.js         # Local Express development server & proxies
├── style.css         # Main application stylesheet
├── package.json      # Dependencies and run scripts
├── README.md         # Documentation
└── LICENSE           # MIT License
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Rishabh** — [@itxRishabh](https://github.com/itxRishabh)

---

<p align="center">
  Made with ❤️ for Creators & Businesses
</p>
<p align="center">
  <sub>Process unlimited images for free. No watermarks. No sign-up required.</sub>
</p>
