/**
 * SEO Audit Proxy — Vercel Serverless Function
 * Fetches a target URL's HTML and response headers, then returns them as JSON
 * so the client-side audit engine can parse everything without CORS issues.
 */
module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }

    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing ?url= parameter.' });
    }

    // Validate URL
    let parsedUrl;
    try {
        parsedUrl = new URL(targetUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Invalid protocol');
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL. Must start with http:// or https://' });
    }

    const origin = parsedUrl.origin;
    const startTime = Date.now();

    try {
        // Fetch the target page, robots.txt, and sitemap.xml in parallel
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const fetchOpts = {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WebToolkitBoxSEOAudit/1.0; +https://webtoolkitbox.com)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
        };

        const [pageRes, robotsRes, sitemapRes] = await Promise.allSettled([
            fetch(targetUrl, fetchOpts),
            fetch(`${origin}/robots.txt`, { ...fetchOpts, signal: AbortSignal.timeout(5000) }).catch(() => null),
            fetch(`${origin}/sitemap.xml`, { ...fetchOpts, signal: AbortSignal.timeout(5000) }).catch(() => null),
        ]);

        clearTimeout(timeout);

        if (pageRes.status === 'rejected') {
            return res.status(502).json({
                error: 'Failed to fetch the target URL.',
                message: pageRes.reason?.message || 'Connection failed or timed out.'
            });
        }

        const page = pageRes.value;
        const html = await page.text();

        // Collect response headers
        const headers = {};
        page.headers.forEach((value, key) => {
            headers[key] = value;
        });

        // Robots.txt
        let robotsTxt = null;
        if (robotsRes.status === 'fulfilled' && robotsRes.value && robotsRes.value.ok) {
            robotsTxt = await robotsRes.value.text();
        }

        // Sitemap.xml
        let sitemapExists = false;
        if (sitemapRes.status === 'fulfilled' && sitemapRes.value && sitemapRes.value.ok) {
            const sitemapText = await sitemapRes.value.text();
            sitemapExists = sitemapText.includes('<urlset') || sitemapText.includes('<sitemapindex');
        }

        const elapsed = Date.now() - startTime;

        return res.status(200).json({
            url: targetUrl,
            finalUrl: page.url, // after redirects
            statusCode: page.status,
            headers,
            html,
            robotsTxt,
            sitemapExists,
            isHttps: parsedUrl.protocol === 'https:',
            responseTimeMs: elapsed,
            pageSize: html.length,
        });

    } catch (error) {
        console.error('[SEO Audit] Error:', error);
        return res.status(500).json({
            error: 'Audit proxy failed',
            message: error.message
        });
    }
};

module.exports.config = {
    api: {
        bodyParser: false,
        responseLimit: '10mb'
    }
};
