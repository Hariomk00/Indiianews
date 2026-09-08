import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useSEO } from "../hooks/useSEO";
import { createNewsSlug } from "../utils/slugify";
import { Play } from "lucide-react";

const CategoryPage = () => {
  const { id } = useParams();
  const [categoryName, setCategoryName] = useState("");
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useSEO({
    title: categoryName ? `${categoryName} News` : "Category News",
    description: categoryName ? `Browse the latest ${categoryName} news, breaking articles, and stories on Indiianews.` : undefined
  });

  useEffect(() => {
    const fetchCategoryAndNews = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get Category details
        const catDocRef = doc(db, "categories", id);
        const catDocSnap = await getDoc(catDocRef);

        if (!catDocSnap.exists() || !catDocSnap.data().status) {
          setError("Category not found or inactive");
          setLoading(false);
          return;
        }

        const catData = catDocSnap.data();
        setCategoryName(catData.name);

        // 2. Get news of this category
        const q = query(
          collection(db, "news"),
          where("category_id", "==", id)
        );
        const querySnapshot = await getDocs(q);
        const articles = [];
        querySnapshot.forEach((doc) => {
          articles.push({ id: doc.id, ...doc.data() });
        });

        // Client-side sort by createdAt descending to avoid composite index requirement in Firestore
        articles.sort((a, b) => {
          const getMs = (val) => {
            if (!val) return 0;
            if (typeof val.toDate === "function") return val.toDate().getTime();
            if (val.seconds) return val.seconds * 1000;
            if (val instanceof Date) return val.getTime();
            return new Date(val).getTime() || 0;
          };
          return getMs(b.createdAt) - getMs(a.createdAt);
        });

        setNewsList(articles);
      } catch (error) {
        console.error("Error loading category news:", error);
        setError("Error loading content");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndNews();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="space-y-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse bg-white dark:bg-gray-900 rounded-xl h-72 border border-gray-150 dark:border-gray-800"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800">
            <p className="text-red-500 font-bold">{error}</p>
            <Link to="/" className="inline-block mt-4 text-red-600 dark:text-red-500 font-bold hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        ) : (
          <div>
            {/* Page Header */}
            <div className="border-l-4 border-red-600 dark:border-red-500 pl-3 mb-8">
              <h2 className="text-3xl font-black uppercase tracking-wider">{categoryName} News</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Articles listed under {categoryName}</p>
            </div>

            {/* News Grid */}
            {newsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {newsList.map((news) => (
                  <Link
                    key={news.id}
                    to={`/news/${createNewsSlug(news.title, news.id)}`}
                    className="group flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-800 transition duration-300"
                  >
                    {/* Card Image */}
                    <div className="h-44 overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {(news.media_type === "video" || news.video_url) && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition duration-300">
                          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-300">
                            <Play size={20} className="fill-current ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-500 transition duration-200 line-clamp-2">
                          {news.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3 leading-relaxed">
                          {news.short_desc}
                        </p>
                      </div>

                      <span className="text-xs text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                        Read Article &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-gray-400 dark:text-gray-500">No news articles found in this category.</p>
                <Link to="/" className="inline-block mt-4 text-red-600 dark:text-red-500 font-bold hover:underline">
                  &larr; Back to Home
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
