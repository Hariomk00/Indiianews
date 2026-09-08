import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { slugify, safeDecodeURIComponent, extractIdFromSlug } from "../utils/slugify";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Calendar, Tag, ArrowLeft, RefreshCw, Play } from "lucide-react";
import { useSEO } from "../hooks/useSEO";

export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const renderContent = (text) => {
  if (!text) return null;

  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(text)) !== null) {
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-line">
          {text.substring(lastIndex, matchIndex)}
        </span>
      );
    }

    const alt = match[1] || "";
    const src = match[2];

    parts.push(
      <span key={`img-${matchIndex}`} className="block my-6 rounded-2xl overflow-hidden shadow-md max-w-full bg-gray-100 dark:bg-gray-800">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-cover max-h-[500px]"
          onError={(e) => {
            e.target.parentNode.style.display = "none";
          }}
        />
        {alt && !alt.startsWith("Image") && (
          <span className="block text-center text-xs text-gray-500 dark:text-gray-400 p-2 italic">
            {alt}
          </span>
        )}
      </span>
    );

    lastIndex = imageRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-line">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return parts;
};

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [categoryName, setCategoryName] = useState("Uncategorized");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useSEO({
    title: news ? news.title : "News Article",
    description: news ? news.short_desc : undefined,
    image: news ? news.image : undefined,
    type: "article"
  });

  useEffect(() => {
    let isMounted = true;

    const fetchNewsDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        let articleData = null;
        let articleId = null;

        // Step 1: Direct ID extraction from slug (e.g., "slug-name-3JDH7Wv6UFHy5LQoPjav" or "3JDH7Wv6UFHy5LQoPjav")
        const extractedId = extractIdFromSlug(id);
        if (extractedId) {
          try {
            const docRef = doc(db, "news", extractedId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              articleData = docSnap.data();
              articleId = docSnap.id;
            }
          } catch (e) {
            console.warn("Direct document lookup failed, proceeding to queries:", e);
          }
        }

        // Step 2: Safe URL Decode
        const rawDecoded = safeDecodeURIComponent(id);

        // Step 3: Query by exact title (supports legacy direct title links)
        if (!articleData && rawDecoded) {
          try {
            const qTitle = query(collection(db, "news"), where("title", "==", rawDecoded), limit(1));
            const querySnap = await getDocs(qTitle);
            if (!querySnap.empty) {
              const firstDoc = querySnap.docs[0];
              articleData = firstDoc.data();
              articleId = firstDoc.id;
            }
          } catch (e) {
            console.warn("Exact title query failed:", e);
          }
        }

        // Step 4: Handle older slashes-replaced-by-hyphens URLs
        if (!articleData && rawDecoded && rawDecoded.includes("-")) {
          try {
            const slashRestoredTitle = rawDecoded.replace(/-/g, "/");
            const qSlash = query(collection(db, "news"), where("title", "==", slashRestoredTitle), limit(1));
            const querySnapSlash = await getDocs(qSlash);
            if (!querySnapSlash.empty) {
              const firstDoc = querySnapSlash.docs[0];
              articleData = firstDoc.data();
              articleId = firstDoc.id;
            }
          } catch (e) {
            console.warn("Slash restored query failed:", e);
          }
        }

        // Step 5: Query by 'slug' field
        if (!articleData && rawDecoded) {
          try {
            const targetSlug = slugify(rawDecoded);
            if (targetSlug) {
              const qSlug = query(collection(db, "news"), where("slug", "==", targetSlug), limit(1));
              const querySnapSlug = await getDocs(qSlug);
              if (!querySnapSlug.empty) {
                const firstDoc = querySnapSlug.docs[0];
                articleData = firstDoc.data();
                articleId = firstDoc.id;
              }
            }
          } catch (e) {
            console.warn("Slug field query failed:", e);
          }
        }

        // Step 6: Fallback scan across recent 200 articles
        if (!articleData) {
          try {
            const qLatest = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(200));
            const querySnapLatest = await getDocs(qLatest);
            const targetSlug = slugify(rawDecoded);

            const matchedDoc = querySnapLatest.docs.find((d) => {
              const data = d.data();
              if (d.id === id) return true;
              if (data.title && (data.title === rawDecoded || slugify(data.title) === targetSlug)) return true;
              return false;
            });

            if (matchedDoc) {
              articleData = matchedDoc.data();
              articleId = matchedDoc.id;
            }
          } catch (e) {
            console.warn("Recent articles fallback query failed:", e);
          }
        }

        if (!isMounted) return;

        if (!articleData) {
          setError("यह समाचार लेख उपलब्ध नहीं है या हटा दिया गया है। (Article not found)");
          setLoading(false);
          return;
        }

        setNews({ ...articleData, id: articleId });

        // Fetch Category name if category_id exists
        if (articleData.category_id) {
          try {
            const catDocRef = doc(db, "categories", articleData.category_id);
            const catDocSnap = await getDoc(catDocRef);
            if (catDocSnap.exists() && isMounted) {
              setCategoryName(catDocSnap.data().name);
            }
          } catch (catErr) {
            console.warn("Category fetch failed:", catErr);
          }
        }
      } catch (err) {
        console.error("Error fetching news article:", err);
        if (isMounted) {
          setError("समाचार लोड करने में समस्या हुई। कृपया पुनः प्रयास करें।");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNewsDetail();

    return () => {
      isMounted = false;
    };
  }, [id, fetchTrigger]);

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("hi-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const youtubeVideoId = news?.video_url ? getYouTubeVideoId(news.video_url) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 dark:hover:text-red-500 transition mb-6"
        >
          <ArrowLeft size={16} />
          मुख्य पृष्ठ पर वापस जाएं (Back to Home)
        </Link>

        {loading ? (
          <div className="space-y-6 animate-pulse bg-white dark:bg-gray-900 p-6 md:p-10 rounded-3xl border border-gray-100 dark:border-gray-800">
            <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-[360px] md:h-[450px] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4">
              <RefreshCw size={22} />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-2">{error}</p>
            <p className="text-gray-500 text-sm mb-6">लिंक पुराना हो सकता है या नेटवर्क में रुकावट आई है।</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setFetchTrigger((prev) => prev + 1)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl text-sm transition"
              >
                पुनः प्रयास करें (Retry)
              </button>
              <Link 
                to="/" 
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
              >
                मुख्य पृष्ठ (Home)
              </Link>
            </div>
          </div>
        ) : (
          <article className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-150 dark:border-gray-800/80 p-6 md:p-10">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug text-gray-950 dark:text-white">
              {news.title}
            </h1>

            {/* Metadata (Category, Date) */}
            <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-5">
              {/* Category */}
              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 px-3 py-1 rounded-full text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                <Tag size={13} />
                {categoryName}
              </div>

              {/* Date */}
              {news.createdAt && (
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(news.createdAt)}
                </div>
              )}

              {/* Video Indicator */}
              {(news.media_type === "video" || news.video_url) && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:amber-400">
                  <Play size={11} className="fill-current" />
                  वीडियो समाचार
                </span>
              )}
            </div>

            {/* Media: Video Player or Featured Image */}
            <div className="mt-7">
              {youtubeVideoId ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`}
                    title={news.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
              ) : news.video_url && !youtubeVideoId ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                  <video
                    src={news.video_url}
                    poster={news.image}
                    controls
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : news.image ? (
                <div className="rounded-2xl overflow-hidden shadow-md max-h-[520px] bg-gray-100 dark:bg-gray-800">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            {/* Short Description highlight */}
            {news.short_desc && (
              <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-200 italic border-l-4 border-red-600 pl-4 py-1">
                {news.short_desc}
              </p>
            )}

            {/* Full News Content */}
            <div className="mt-6 text-gray-800 dark:text-gray-200 leading-relaxed text-base md:text-lg flex flex-col gap-4">
              {renderContent(news.full_content)}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewsDetail;
