/**
 * ImgKit SEO Audit Tool — Client Engine
 * Parses HTML, headers, and metadata to generate a comprehensive SEO report.
 */

document.addEventListener('DOMContentLoaded', () => {
    new SEOAuditTool();
    initializeTheme();
});

// --- Automatic Day/Night Theme Controller ---
function initializeTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (!themeBtn) return;

    const themeIcon = themeBtn.querySelector('i');
    
    // Helper to set theme state
    function setTheme(mode) {
        if (mode === 'light') {
            document.body.classList.add('light-theme');
            if (themeIcon) {
                themeIcon.className = 'fas fa-moon';
            }
            themeBtn.title = 'Switch to Dark Mode';
        } else {
            document.body.classList.remove('light-theme');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
            themeBtn.title = 'Switch to Light Mode';
        }
    }

    // Get saved theme preference
    const savedTheme = localStorage.getItem('themePreference');

    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Default to dark mode on initial load
        setTheme('dark');
    }

    // Toggle on button click
    themeBtn.addEventListener('click', () => {
        const isCurrentlyLight = document.body.classList.contains('light-theme');
        const newTheme = isCurrentlyLight ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('themePreference', newTheme);
    });
}

class SEOAuditTool {
    constructor() {
        this.urlInput = document.getElementById('auditUrlInput');
        this.auditBtn = document.getElementById('auditBtn');
        this.loadingSection = document.getElementById('loadingSection');
        this.loadingText = document.getElementById('loadingText');
        this.resultsSection = document.getElementById('resultsSection');
        
        // Stats elements
        this.overallScore = document.getElementById('overallScore');
        this.scoreLabel = document.getElementById('scoreLabel');
        this.auditedUrlEl = document.getElementById('auditedUrl');
        this.passCountEl = document.getElementById('passCount');
        this.warnCountEl = document.getElementById('warnCount');
        this.failCountEl = document.getElementById('failCount');
        
        // Quick stats
        this.qsResponseTime = document.getElementById('qsResponseTime');
        this.qsPageSize = document.getElementById('qsPageSize');
        this.qsHttps = document.getElementById('qsHttps');
        this.qsWordCount = document.getElementById('qsWordCount');
        this.qsLinks = document.getElementById('qsLinks');
        this.qsImages = document.getElementById('qsImages');
        
        this.categoriesContainer = document.getElementById('auditCategories');
        this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        
        this.initEvents();
    }

    initEvents() {
        this.auditBtn.addEventListener('click', () => this.startAudit());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startAudit();
        });
        if (this.downloadPdfBtn) {
            this.downloadPdfBtn.addEventListener('click', () => this.downloadPdf());
        }

        // 1-Click Quick Demo Chips
        document.querySelectorAll('.demo-chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetUrl = btn.getAttribute('data-url');
                if (targetUrl && this.urlInput) {
                    this.urlInput.value = targetUrl;
                    this.startAudit();
                }
            });
        });
    }

    showNotification(msg, type = 'info') {
        // Fallback or use standard window notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${type === 'error' ? 'var(--error)' : 'var(--surface-2)'};
            color: var(--text);
            border: 1px solid var(--border);
            padding: 12px 24px;
            border-radius: var(--radius-md);
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 10000;
            transition: opacity 0.3s;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    updateStep(stepId, status) {
        const stepEl = document.getElementById(stepId);
        if (!stepEl) return;
        stepEl.className = 'step ' + status;
    }

    async startAudit() {
        let url = this.urlInput.value.trim();
        if (!url) {
            this.showNotification('Please enter a URL.', 'error');
            return;
        }

        // Auto-prep protocol if missing
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
            this.urlInput.value = url;
        }

        try {
            // Reset UI
            this.loadingSection.style.display = 'block';
            this.resultsSection.style.display = 'none';
            this.auditBtn.disabled = true;
            
            const steps = ['stepFetch', 'stepMeta', 'stepContent', 'stepLinks', 'stepSecurity', 'stepPerformance'];
            steps.forEach(id => this.updateStep(id, ''));

            // Step 1: Fetch
            this.updateStep('stepFetch', 'active');
            this.loadingText.textContent = 'Connecting to proxy and loading target URL...';
            
            const proxyUrl = `/api/seo-audit?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to fetch the webpage.');
            }

            const data = await response.json();
            this.updateStep('stepFetch', 'done');

            // Set quick stats
            this.qsResponseTime.textContent = `${data.responseTimeMs}ms`;
            this.qsPageSize.textContent = `${(data.pageSize / 1024).toFixed(1)} KB`;
            this.qsHttps.innerHTML = data.isHttps ? 
                `<span style="color:var(--success)"><i class="fas fa-lock"></i> Yes</span>` : 
                `<span style="color:var(--error)"><i class="fas fa-unlock"></i> No</span>`;
            
            this.auditedUrlEl.textContent = data.finalUrl || url;

            // Start scanning page
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.html, 'text/html');

            this.runAudits(doc, data);

        } catch (error) {
            console.error('Audit failed:', error);
            this.loadingSection.style.display = 'none';
            this.auditBtn.disabled = false;
            this.showNotification(error.message || 'Failed to analyze page.', 'error');
        }
    }

    runAudits(doc, data) {
        const auditResults = [];

        // 1. Meta Tags Audit
        this.updateStep('stepMeta', 'active');
        const metaAudit = this.auditMetaTags(doc, data);
        auditResults.push(metaAudit);
        this.updateStep('stepMeta', 'done');

        // 2. Heading Structure Audit
        this.updateStep('stepContent', 'active');
        const headingsAudit = this.auditHeadings(doc);
        auditResults.push(headingsAudit);

        // 3. Content Quality Audit
        const contentAudit = this.auditContent(doc);
        auditResults.push(contentAudit);
        this.updateStep('stepContent', 'done');

        // 4. Links Analysis Audit
        this.updateStep('stepLinks', 'active');
        const linksAudit = this.auditLinks(doc, data.finalUrl);
        auditResults.push(linksAudit);
        this.updateStep('stepLinks', 'done');

        // 5. Image Alt Audit
        const imagesAudit = this.auditImages(doc);
        auditResults.push(imagesAudit);

        // 6. Security Headers Audit
        this.updateStep('stepSecurity', 'active');
        const securityAudit = this.auditSecurity(data.headers, data.isHttps);
        auditResults.push(securityAudit);
        this.updateStep('stepSecurity', 'done');

        // 7. Structured Schema Audit
        const schemaAudit = this.auditSchema(doc);
        auditResults.push(schemaAudit);

        // 8. Social Sharing (Open Graph) Audit
        const ogAudit = this.auditOpenGraph(doc);
        auditResults.push(ogAudit);

        // 9. Technical Audit (Robots / Sitemap / Viewport)
        const technicalAudit = this.auditTechnical(doc, data);
        auditResults.push(technicalAudit);

        // 10. Performance Audit
        this.updateStep('stepPerformance', 'active');
        const performanceAudit = this.auditPerformance(data);
        auditResults.push(performanceAudit);
        this.updateStep('stepPerformance', 'done');

        // Calculate Totals & Score
        this.renderReport(auditResults);
    }

    auditMetaTags(doc, data) {
        const issues = [];
        let score = 100;

        // Title Tag
        const titleEl = doc.querySelector('title');
        const title = titleEl ? titleEl.textContent.trim() : '';
        if (!title) {
            issues.push({ status: 'fail', title: 'Missing Title Tag', detail: 'The webpage has no `<title>` tag. This is critical for search indexing.' });
            score -= 30;
        } else if (title.length < 30 || title.length > 60) {
            issues.push({ status: 'warn', title: 'Sub-optimal Title Length', detail: `Title length is <code>${title.length}</code> characters. Best practice is 30-60 characters. Current title: "${title}"` });
            score -= 10;
        } else {
            issues.push({ status: 'pass', title: 'Perfect Title Tag', detail: `Title is <code>${title.length}</code> characters: "${title}"` });
        }

        // Meta Description
        const descEl = doc.querySelector('meta[name="description"]');
        const desc = descEl ? descEl.getAttribute('content').trim() : '';
        if (!desc) {
            issues.push({ status: 'fail', title: 'Missing Meta Description', detail: 'The page lacks a meta description. Search engines will auto-generate text from body content, which may not be optimized.' });
            score -= 25;
        } else if (desc.length < 110 || desc.length > 160) {
            issues.push({ status: 'warn', title: 'Meta Description Length', detail: `Description length is <code>${desc.length}</code> characters. Best practice is 110-160 characters. Current description: "${desc}"` });
            score -= 10;
        } else {
            issues.push({ status: 'pass', title: 'Perfect Meta Description', detail: `Description is <code>${desc.length}</code> characters.` });
        }

        // Canonical Link
        const canonical = doc.querySelector('link[rel="canonical"]');
        if (!canonical) {
            issues.push({ status: 'warn', title: 'Missing Canonical Tag', detail: 'No canonical URL specified. Add `<link rel="canonical" href="...">` to prevent duplicate content issues.' });
            score -= 10;
        } else {
            issues.push({ status: 'pass', title: 'Canonical Tag Found', detail: `Canonical points correctly to: <code>${canonical.getAttribute('href')}</code>` });
        }

        // Robots Meta Tag
        const robots = doc.querySelector('meta[name="robots"]');
        if (robots) {
            issues.push({ status: 'info', title: 'Robots Directives Configured', detail: `Robots meta is set to: <code>${robots.getAttribute('content')}</code>` });
        }

        return {
            name: 'Meta Tags & Indexing',
            icon: 'fa-tags',
            score: Math.max(0, score),
            issues
        };
    }

    auditHeadings(doc) {
        const issues = [];
        let score = 100;

        const h1s = doc.querySelectorAll('h1');
        const h2s = doc.querySelectorAll('h2');
        const h3s = doc.querySelectorAll('h3');

        // H1 checks
        if (h1s.length === 0) {
            issues.push({ status: 'fail', title: 'Missing H1 Heading', detail: 'The page has no H1 header. Search engines look for an H1 tag to understand the main topic of the page.' });
            score -= 40;
        } else if (h1s.length > 1) {
            issues.push({ status: 'warn', title: 'Multiple H1 Headings Found', detail: `Found <code>${h1s.length}</code> H1 headings. Best practice is to have exactly one primary H1 header per page.` });
            score -= 15;
        } else {
            issues.push({ status: 'pass', title: 'Exactly One H1 Tag Found', detail: `H1 tag text: "${h1s[0].textContent.trim()}"` });
        }

        // Heading Structure Balance
        if (h2s.length === 0) {
            issues.push({ status: 'warn', title: 'No H2 tags found', detail: 'Consider using H2 headers to structure sections and subsections of your content.' });
            score -= 10;
        } else {
            issues.push({ status: 'pass', title: 'Proper Subheading Usage', detail: `Found <code>${h2s.length}</code> H2 headings and <code>${h3s.length}</code> H3 headings.` });
        }

        return {
            name: 'Heading Hierarchy',
            icon: 'fa-heading',
            score: Math.max(0, score),
            issues
        };
    }

    auditContent(doc) {
        const issues = [];
        let score = 100;

        const textContent = doc.body ? doc.body.textContent || '' : '';
        const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        this.qsWordCount.textContent = wordCount;

        // Word count levels
        if (wordCount < 300) {
            issues.push({ status: 'fail', title: 'Thin Content Detected', detail: `Word count is only <code>${wordCount}</code> words. Pages with less than 300 words are flagged as thin content by search engines.` });
            score -= 30;
        } else if (wordCount < 600) {
            issues.push({ status: 'warn', title: 'Slightly Thin Content', detail: `Word count is <code>${wordCount}</code> words. Try aiming for 600+ words to rank higher on complex keywords.` });
            score -= 10;
        } else {
            issues.push({ status: 'pass', title: 'Good Content Volume', detail: `Total word count is <code>${wordCount}</code> words. Good for general indexing.` });
        }

        // Flesch-Kincaid Readability Approximation
        const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
        const wordsPerSentence = wordCount / sentences;
        if (wordsPerSentence > 25) {
            issues.push({ status: 'warn', title: 'Complex Sentences', detail: `Average sentence length is <code>${wordsPerSentence.toFixed(1)}</code> words. Break up paragraphs to improve readability for users.` });
            score -= 5;
        } else {
            issues.push({ status: 'pass', title: 'Easy Readability Structure', detail: `Average sentence length is comfortable at <code>${wordsPerSentence.toFixed(1)}</code> words.` });
        }

        return {
            name: 'Content Quality',
            icon: 'fa-file-alt',
            score: Math.max(0, score),
            issues
        };
    }

    auditLinks(doc, finalUrl) {
        const issues = [];
        let score = 100;

        const baseOrigin = new URL(finalUrl).origin;
        const links = doc.querySelectorAll('a[href]');
        this.qsLinks.textContent = links.length;

        let internalCount = 0;
        let externalCount = 0;
        let emptyLinks = 0;

        links.forEach(link => {
            const href = link.getAttribute('href').trim();
            if (!href || href === '#' || href.toLowerCase().startsWith('javascript:')) {
                emptyLinks++;
                return;
            }

            try {
                const targetUrl = new URL(href, finalUrl);
                if (targetUrl.origin === baseOrigin) {
                    internalCount++;
                } else {
                    externalCount++;
                }
            } catch (e) {
                // Invalid format
            }
        });

        if (emptyLinks > 0) {
            issues.push({ status: 'warn', title: 'Empty or JavaScript links', detail: `Found <code>${emptyLinks}</code> empty or javascript link targets. Replace them with proper descriptive link targets.` });
            score -= emptyLinks * 2;
        }

        issues.push({ status: 'info', title: 'Link Types Summary', detail: `Found <code>${internalCount}</code> internal links and <code>${externalCount}</code> external outbound links.` });

        if (internalCount === 0) {
            issues.push({ status: 'warn', title: 'No Internal Links', detail: 'Internal links are crucial for link-equity flows and web index crawling.' });
            score -= 10;
        }

        return {
            name: 'Link Profile',
            icon: 'fa-link',
            score: Math.max(0, score),
            issues
        };
    }

    auditImages(doc) {
        const issues = [];
        let score = 100;

        const images = doc.querySelectorAll('img');
        this.qsImages.textContent = images.length;

        let missingAlt = 0;

        images.forEach(img => {
            const alt = img.getAttribute('alt');
            if (alt === null || alt.trim() === '') {
                missingAlt++;
            }
        });

        if (images.length === 0) {
            issues.push({ status: 'info', title: 'No Images Found', detail: 'The webpage has no images.' });
        } else if (missingAlt > 0) {
            issues.push({ status: 'fail', title: 'Missing Alt Attributes', detail: `Found <code>${missingAlt}</code> out of <code>${images.length}</code> images missing alt descriptions. Search crawlers require alt tags to parse image contents.` });
            score -= Math.min(40, missingAlt * 10);
        } else {
            issues.push({ status: 'pass', title: 'All Images Have Alt Attributes', detail: `All <code>${images.length}</code> images contain proper alternative descriptions.` });
        }

        return {
            name: 'Image Optimization',
            icon: 'fa-image',
            score: Math.max(0, score),
            issues
        };
    }

    auditSecurity(headers, isHttps) {
        const issues = [];
        let score = 100;

        if (!isHttps) {
            issues.push({ status: 'fail', title: 'Insecure Connection (HTTP)', detail: 'Your website does not enforce HTTPS. Search engines downrank sites without valid SSL layers.' });
            score -= 50;
        } else {
            issues.push({ status: 'pass', title: 'Enforces Secure SSL (HTTPS)', detail: 'Webpage loaded securely over SSL.' });
        }

        // Security headers checklist
        const securityHeaders = {
            'strict-transport-security': { name: 'HSTS (Strict Transport Security)', weight: 10 },
            'content-security-policy': { name: 'Content Security Policy (CSP)', weight: 15 },
            'x-frame-options': { name: 'X-Frame-Options (Clickjacking Protection)', weight: 10 },
            'x-content-type-options': { name: 'X-Content-Type-Options', weight: 10 },
            'referrer-policy': { name: 'Referrer Policy', weight: 5 }
        };

        for (const [key, value] of Object.entries(securityHeaders)) {
            if (headers[key]) {
                issues.push({ status: 'pass', title: `${value.name} Enabled`, detail: `Header value: <code>${headers[key]}</code>` });
            } else {
                issues.push({ status: 'warn', title: `Missing ${value.name}`, detail: `Add the <code>${key}</code> header to protect your page against scripting exploits.` });
                score -= value.weight;
            }
        }

        return {
            name: 'Security & HTTP Headers',
            icon: 'fa-shield-alt',
            score: Math.max(0, score),
            issues
        };
    }

    auditSchema(doc) {
        const issues = [];
        let score = 100;

        const jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
        const microdata = doc.querySelectorAll('[itemscope]');

        if (jsonLd.length === 0 && microdata.length === 0) {
            issues.push({ status: 'warn', title: 'Missing Schema Markup', detail: 'Structured schema data (like JSON-LD) was not detected. Adding structured data helps search engines show rich search snippets.' });
            score -= 20;
        } else {
            issues.push({ status: 'pass', title: 'Structured Schema Data Detected', detail: `Found <code>${jsonLd.length}</code> JSON-LD schemas and <code>${microdata.length}</code> microdata item scopes.` });
            
            jsonLd.forEach((tag, idx) => {
                try {
                    const parsed = JSON.parse(tag.textContent);
                    const type = parsed['@type'] || parsed.type || 'Generic Schema';
                    issues.push({ status: 'info', title: `Schema Tag #${idx + 1}`, detail: `Detected schema category: <code>${type}</code>` });
                } catch (e) {
                    issues.push({ status: 'fail', title: `Broken Schema Tag #${idx + 1}`, detail: 'The JSON content inside this schema block is invalid and cannot be parsed.' });
                    score -= 5;
                }
            });
        }

        return {
            name: 'Structured Data (Schema)',
            icon: 'fa-code',
            score: Math.max(0, score),
            issues
        };
    }

    auditOpenGraph(doc) {
        const issues = [];
        let score = 100;

        const ogTags = {
            'og:title': 'Open Graph Title',
            'og:description': 'Open Graph Description',
            'og:image': 'Open Graph Preview Image',
            'og:url': 'Open Graph URL'
        };

        let foundCount = 0;
        for (const [property, label] of Object.entries(ogTags)) {
            const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
            if (el && el.getAttribute('content')) {
                issues.push({ status: 'pass', title: `${label} found`, detail: `Value: "${el.getAttribute('content')}"` });
                foundCount++;
            } else {
                issues.push({ status: 'warn', title: `Missing ${label}`, detail: `Add standard <code>${property}</code> meta properties to control link sharing appearances on social media.` });
                score -= 10;
            }
        }

        if (foundCount === 0) {
            score = 50; // default low if no OG properties are configured
        }

        return {
            name: 'Social Cards (Open Graph)',
            icon: 'fa-share-nodes',
            score: Math.max(0, score),
            issues
        };
    }

    auditTechnical(doc, data) {
        const issues = [];
        let score = 100;

        // Robots.txt
        if (data.robotsTxt) {
            issues.push({ status: 'pass', title: 'robots.txt Found', detail: 'Robots file controls search crawler parameters successfully.' });
        } else {
            issues.push({ status: 'warn', title: 'Missing robots.txt', detail: 'A robots.txt file was not found on the origin server.' });
            score -= 15;
        }

        // Sitemap.xml
        if (data.sitemapExists) {
            issues.push({ status: 'pass', title: 'sitemap.xml Detected', detail: 'Sitemaps help engines index and navigate website urls.' });
        } else {
            issues.push({ status: 'warn', title: 'Missing or unreachable sitemap.xml', detail: 'No valid XML sitemap layout could be fetched from standard sitemap paths.' });
            score -= 15;
        }

        // Viewport Meta
        const viewport = doc.querySelector('meta[name="viewport"]');
        if (viewport) {
            issues.push({ status: 'pass', title: 'Viewport configured for Mobile', detail: `Configuration: <code>${viewport.getAttribute('content')}</code>` });
        } else {
            issues.push({ status: 'fail', title: 'Viewport Meta Missing', detail: 'No viewport parameters configured. This will cause layout issues on mobile viewports.' });
            score -= 30;
        }

        // Charset
        const charset = doc.querySelector('meta[charset], meta[http-equiv="Content-Type"]');
        if (charset) {
            issues.push({ status: 'pass', title: 'Character Encoding Defined', detail: 'Page uses standard character set attributes.' });
        } else {
            issues.push({ status: 'warn', title: 'Encoding Not Defined', detail: 'Ensure character encoding is defined explicitly via `<meta charset="UTF-8">`.' });
            score -= 10;
        }

        return {
            name: 'Technical SEO',
            icon: 'fa-cogs',
            score: Math.max(0, score),
            issues
        };
    }

    auditPerformance(data) {
        const issues = [];
        let score = 100;

        // Response Speed
        const speed = data.responseTimeMs;
        if (speed < 300) {
            issues.push({ status: 'pass', title: 'Excellent Response Speed', detail: `Server responded in <code>${speed}ms</code>.` });
        } else if (speed < 1000) {
            issues.push({ status: 'warn', title: 'Moderate Response Speed', detail: `Server responded in <code>${speed}ms</code>. Optimizing database requests could help.` });
            score -= 15;
        } else {
            issues.push({ status: 'fail', title: 'Slow Server Response', detail: `Server responded in <code>${speed}ms</code>. Highly loaded servers directly harm ranking performance.` });
            score -= 35;
        }

        // HTML Size
        const sizeKb = data.pageSize / 1024;
        if (sizeKb < 100) {
            issues.push({ status: 'pass', title: 'Optimal HTML Size', detail: `Page source payload size is <code>${sizeKb.toFixed(1)} KB</code>.` });
        } else {
            issues.push({ status: 'warn', title: 'Large HTML Payload Size', detail: `Page source payload is <code>${sizeKb.toFixed(1)} KB</code>. Compress files and strip unnecessary scripts.` });
            score -= 10;
        }

        return {
            name: 'Performance Indicators',
            icon: 'fa-tachometer-alt',
            score: Math.max(0, score),
            issues
        };
    }

    renderReport(categories) {
        this.loadingSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        this.auditBtn.disabled = false;

        this.categoriesContainer.innerHTML = '';

        let totalScore = 0;
        let passed = 0;
        let warnings = 0;
        let failed = 0;

        categories.forEach(cat => {
            totalScore += cat.score;
            
            // Build issues list
            let issuesHtml = '';
            cat.issues.forEach(issue => {
                let iconClass = 'fa-info-circle info';
                if (issue.status === 'pass') { passed++; iconClass = 'fa-check-circle pass'; }
                else if (issue.status === 'warn') { warnings++; iconClass = 'fa-exclamation-triangle warn'; }
                else if (issue.status === 'fail') { failed++; iconClass = 'fa-times-circle fail'; }
                
                issuesHtml += `
                    <div class="issue-row">
                        <div class="issue-icon ${issue.status}">
                            <i class="fas ${iconClass.split(' ')[0]}"></i>
                        </div>
                        <div class="issue-content">
                            <div class="issue-title">${issue.title}</div>
                            <div class="issue-detail">${issue.detail}</div>
                        </div>
                    </div>
                `;
            });

            // Set category status class
            let catStatus = 'pass';
            if (cat.score < 50) catStatus = 'fail';
            else if (cat.score < 85) catStatus = 'warn';

            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <div class="category-header">
                    <div class="category-icon ${catStatus}">
                        <i class="fas ${cat.icon}"></i>
                    </div>
                    <div class="category-info">
                        <div class="category-name">${cat.name}</div>
                        <div class="category-desc">${cat.issues.length} points analyzed</div>
                    </div>
                    <div class="category-score ${catStatus}">${cat.score}</div>
                    <i class="fas fa-chevron-down category-chevron"></i>
                </div>
                <div class="category-body">
                    <div class="category-issues">
                        ${issuesHtml}
                    </div>
                </div>
            `;

            // Accordion click
            const header = card.querySelector('.category-header');
            header.addEventListener('click', () => {
                const isOpen = card.classList.contains('open');
                // Close all cards first
                document.querySelectorAll('.category-card').forEach(c => c.classList.remove('open'));
                if (!isOpen) {
                    card.classList.add('open');
                }
            });

            this.categoriesContainer.appendChild(card);
        });

        // Set counters
        this.passCountEl.textContent = passed;
        this.warnCountEl.textContent = warnings;
        this.failCountEl.textContent = failed;

        // Set Print Date
        const printDateEl = document.getElementById('printDate');
        if (printDateEl) {
            printDateEl.textContent = new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
 
        // Weighted Average Score
        const finalScore = Math.round(totalScore / categories.length);
        this.overallScore.textContent = finalScore;

        // Gauge circular animation
        const offset = 326.73 - (326.73 * finalScore) / 100;
        const circle = document.getElementById('gaugeCircle');
        circle.style.strokeDashoffset = offset;

        // Gauge color
        if (finalScore >= 85) {
            circle.style.stroke = 'var(--success)';
            this.scoreLabel.textContent = 'Excellent Website SEO';
            this.scoreLabel.style.color = 'var(--success)';
        } else if (finalScore >= 50) {
            circle.style.stroke = 'var(--warning)';
            this.scoreLabel.textContent = 'Action Required';
            this.scoreLabel.style.color = 'var(--warning)';
        } else {
            circle.style.stroke = 'var(--error)';
            this.scoreLabel.textContent = 'Critical Optimization Needed';
            this.scoreLabel.style.color = 'var(--error)';
        }
    }

    downloadPdf() {
        const auditedUrl = this.auditedUrlEl.textContent.trim() || 'website';
        const cleanName = auditedUrl.replace(/https?:\/\//i, '').replace(/[\/:]/g, '_');
        const originalTitle = document.title;
        
        // Remember which cards were open
        const cards = document.querySelectorAll('.category-card');
        const cardStates = Array.from(cards).map(c => c.classList.contains('open'));
        
        // Expand all accordions so they show details on print
        cards.forEach(c => c.classList.add('open'));
        
        // Change document title for clean print-to-PDF filename
        document.title = `WebToolkitBox_SEO_Report_${cleanName}`;
        
        // Trigger browser native print / PDF export
        window.print();
        
        // Restore title
        document.title = originalTitle;
        
        // Restore accordion states
        cards.forEach((c, idx) => {
            if (!cardStates[idx]) {
                c.classList.remove('open');
            }
        });
    }
}
