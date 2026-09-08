import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { createNewsSlug } from '../src/utils/slugify.js';

// Standard ES modules setup for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://indiianews.in';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

// Fetch documents helper using Google Firestore REST API
const fetchFirestoreDocuments = (collectionName) => {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/news-app-58b71/databases/(default)/documents/${collectionName}?pageSize=1000`;
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const parsed = JSON.parse(buffer.toString('utf8'));
          resolve(parsed.documents || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

async function generate() {
  console.log('--- Generating SEO Assets: sitemap.xml, sitemap-news.xml, rss.xml, and robots.txt ---');
  
  const nowIso = new Date().toISOString();
  const urls = [
    { 
      loc: `${BASE_URL}/`, 
      lastmod: nowIso, 
      changefreq: 'always', 
      priority: '1.0' 
    }
  ];

  const newsItems = [];

  try {
    // 1. Fetch categories
    console.log('Fetching active categories from Firestore...');
    const categories = await fetchFirestoreDocuments('categories');
    let categoriesCount = 0;
    categories.forEach(doc => {
      const fields = doc.fields || {};
      const status = fields.status?.booleanValue;
      if (status === true) {
        const id = doc.name.split('/').pop();
        urls.push({
          loc: `${BASE_URL}/category/${id}`,
          lastmod: nowIso,
          changefreq: 'daily',
          priority: '0.8'
        });
        categoriesCount++;
      }
    });
    console.log(`Added ${categoriesCount} categories to sitemap.`);
  } catch (err) {
    console.error('Warning: Failed to fetch categories for sitemap:', err.message);
  }

  try {
    // 2. Fetch news articles
    console.log('Fetching news articles from Firestore...');
    const news = await fetchFirestoreDocuments('news');
    let newsCount = 0;

    news.forEach(doc => {
      const fields = doc.fields || {};
      const title = fields.title?.stringValue;
      const shortDesc = fields.short_desc?.stringValue || '';
      const id = doc.name.split('/').pop();
      const rawDate = fields.updatedAt?.timestampValue || fields.createdAt?.timestampValue;
      const articleDate = rawDate ? new Date(rawDate).toISOString() : nowIso;

      if (title && id) {
        const cleanSlug = createNewsSlug(title, id);
        const articleUrl = `${BASE_URL}/news/${cleanSlug}`;

        urls.push({
          loc: articleUrl,
          lastmod: articleDate,
          changefreq: 'weekly',
          priority: '0.8'
        });

        newsItems.push({
          id,
          title,
          shortDesc,
          url: articleUrl,
          pubDate: articleDate,
          rawDate: new Date(articleDate)
        });

        newsCount++;
      }
    });
    console.log(`Added ${newsCount} clean news URLs to sitemap with <lastmod> timestamps.`);
  } catch (err) {
    console.error('Warning: Failed to fetch news articles for sitemap:', err.message);
  }

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // 3. Build Main sitemap.xml with <lastmod>
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  xml += '</urlset>\n';

  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`✓ Successfully generated clean sitemap.xml at: ${sitemapPath}`);

  // 4. Build Google News Sitemap (sitemap-news.xml) for fresh articles
  // Google News sitemaps prioritize the most recent articles
  const recentNews = [...newsItems]
    .sort((a, b) => b.rawDate - a.rawDate)
    .slice(0, 100);

  let newsXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  newsXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';
  recentNews.forEach(item => {
    newsXml += '  <url>\n';
    newsXml += `    <loc>${escapeXml(item.url)}</loc>\n`;
    newsXml += '    <news:news>\n';
    newsXml += '      <news:publication>\n';
    newsXml += '        <news:name>Indiianews</news:name>\n';
    newsXml += '        <news:language>hi</news:language>\n';
    newsXml += '      </news:publication>\n';
    newsXml += `      <news:publication_date>${item.pubDate}</news:publication_date>\n`;
    newsXml += `      <news:title>${escapeXml(item.title)}</news:title>\n`;
    newsXml += '    </news:news>\n';
    newsXml += '  </url>\n';
  });
  newsXml += '</urlset>\n';

  const newsSitemapPath = path.join(PUBLIC_DIR, 'sitemap-news.xml');
  fs.writeFileSync(newsSitemapPath, newsXml, 'utf8');
  console.log(`✓ Successfully generated Google News sitemap at: ${newsSitemapPath}`);

  // 5. Build RSS 2.0 Feed (rss.xml) for instant discovery by Googlebot-News and RSS readers
  let rssXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  rssXml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  rssXml += '  <channel>\n';
  rssXml += '    <title>Indiianews | ताज़ा खबरें एवं ब्रेकिंग न्यूज़</title>\n';
  rssXml += `    <link>${BASE_URL}</link>\n`;
  rssXml += '    <description>Indiianews - देश और दुनिया की ताज़ा ख़बरों का सबसे विश्वसनीय माध्यम।</description>\n';
  rssXml += '    <language>hi</language>\n';
  rssXml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
  rssXml += `    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />\n`;

  recentNews.forEach(item => {
    rssXml += '    <item>\n';
    rssXml += `      <title>${escapeXml(item.title)}</title>\n`;
    rssXml += `      <link>${escapeXml(item.url)}</link>\n`;
    rssXml += `      <guid isPermaLink="true">${escapeXml(item.url)}</guid>\n`;
    rssXml += `      <pubDate>${item.rawDate.toUTCString()}</pubDate>\n`;
    rssXml += `      <description>${escapeXml(item.shortDesc || item.title)}</description>\n`;
    rssXml += '    </item>\n';
  });

  rssXml += '  </channel>\n';
  rssXml += '</rss>\n';

  const rssPath = path.join(PUBLIC_DIR, 'rss.xml');
  fs.writeFileSync(rssPath, rssXml, 'utf8');
  console.log(`✓ Successfully generated RSS Feed at: ${rssPath}`);

  // 6. Build and write optimized robots.txt
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Allow: /category/
Allow: /news/
Disallow: /admin/
Disallow: /admin/*

# Dedicated Googlebot Directives
User-agent: Googlebot
Allow: /
Allow: /news/
Allow: /category/
Disallow: /admin/

# Googlebot-News Directives
User-agent: Googlebot-News
Allow: /
Allow: /news/
Disallow: /admin/

# Bingbot Directives
User-agent: Bingbot
Allow: /
Allow: /news/
Disallow: /admin/

# Sitemaps & Feeds for Immediate Discovery
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-news.xml
Sitemap: ${BASE_URL}/rss.xml
`;

  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
  console.log(`✓ Successfully generated robots.txt at: ${robotsPath}`);
}

generate();
