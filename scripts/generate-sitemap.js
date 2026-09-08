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
  console.log('--- Generating SEO Assets: sitemap.xml and robots.txt ---');
  
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

  // 4. Build and write optimized robots.txt with single clean sitemap
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

# Primary Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;

  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
  console.log(`✓ Successfully generated robots.txt at: ${robotsPath}`);
}

generate();
