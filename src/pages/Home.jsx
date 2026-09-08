import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useSEO } from "../hooks/useSEO";
import { createNewsSlug } from "../utils/slugify";
import { Play } from "lucide-react";

const Home = () => {
  useSEO();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [breakingNews, setBreakingNews] = useState("Stay tuned for live updates • PM Kisan Samman Nidhi Portal updates out • Rajveer sagai updates inside!");
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const displaySlides = slides.length > 0 ? slides : [
    {
      id: "default-1",
      image: "/AA1wQy2w.jpeg",
      link: "https://pmkisan.gov.in/",
      description: "PM Kisan Samman Nidhi Portal updates out • Check status and details online."
    }
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const articles = [];
        querySnapshot.forEach((doc) => {
          articles.push({ id: doc.id, ...doc.data() });
        });
        setNewsList(articles);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBreakingNews = async () => {
      try {
        const docRef = doc(db, "settings", "breaking");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().text) {
          setBreakingNews(docSnap.data().text);
        }
      } catch (error) {
        console.error("Error fetching breaking news:", error);
      }
    };

    const fetchSlides = async () => {
      try {
        const q = query(collection(db, "slides"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setSlides(list);
      } catch (error) {
        console.error("Error fetching slides:", error);
      } finally {
        setBannerLoading(false);
      }
    };

    fetchNews();
    fetchBreakingNews();
    fetchSlides();
  }, []);

  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % displaySlides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [displaySlides]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />

      {/* Breaking News Marquee */}
      <div className="bg-red-600 dark:bg-red-700 text-white font-bold h-10 flex items-center overflow-hidden relative shadow-inner">
        <div className="absolute left-0 top-0 bottom-0 bg-red-800 px-4 flex items-center z-10 font-extrabold uppercase text-xs tracking-wider shadow-md">
          Breaking
        </div>
        <div className="w-full flex whitespace-nowrap pl-24">
          <span className="animate-marquee inline-block text-sm uppercase tracking-wide py-1 font-semibold">
            {breakingNews}
          </span>
        </div>
      </div>

      {/* Main Body container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scheme Slides Carousel */}
        {bannerLoading ? (
          <section className="mb-12 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-850 animate-pulse h-[300px] md:h-[450px]">
            <div className="w-full h-full bg-gray-200 dark:bg-gray-800"></div>
          </section>
        ) : displaySlides.length > 0 ? (
          <section className="mb-12 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-850 relative group">
            <div className="relative w-full overflow-hidden h-[300px] md:h-[450px]">
              {/* Carousel Slides Container */}
              <div 
                className="flex flex-row-reverse w-full h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(${currentSlideIndex * 100}%)` }}
              >
                {displaySlides.map((slide) => (
                  <div key={slide.id} className="min-w-full w-full h-full relative">
                    {/* Clickable Slide Image - spanning whole card */}
                    <a 
                      href={slide.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full h-full overflow-hidden block relative group/img"
                    >
                      <img 
                        src={slide.image} 
                        alt={slide.description || "Scheme slide"}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                        }}
                        className="w-full h-full object-cover group-hover/img:scale-102 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover/img:bg-black/0 transition duration-300"></div>
                    </a>

                    {/* Content overlay on top of the image */}
                    {slide.description && (
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10">
                        <span className="inline-block px-3 py-1 bg-red-600 text-white font-bold uppercase tracking-wider text-[10px] md:text-xs rounded-full mb-3 w-fit pointer-events-auto">
                          Scheme Alert
                        </span>
                        <h2 className="text-lg md:text-2xl font-black tracking-tight leading-tight text-white drop-shadow-md line-clamp-2 md:max-w-3xl">
                          {slide.description}
                        </h2>
                        {slide.link && (
                          <a 
                            href={slide.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs md:text-sm font-extrabold uppercase tracking-wider text-red-405 hover:text-red-305 transition pointer-events-auto w-fit"
                          >
                            Check Status & Apply Online &rarr;
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Indicators / Dots */}
              {displaySlides.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
                  {displaySlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlideIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentSlideIndex === index ? "w-6 bg-red-600" : "w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400"
                      }`}
                      title={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Latest News Title */}
        <div className="border-l-4 border-red-600 dark:border-red-500 pl-3 mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wider">Latest Articles</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fresh stories published recently</p>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-white dark:bg-gray-900 rounded-2xl h-80 border border-gray-100 dark:border-gray-850"></div>
            ))}
          </div>
        ) : newsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsList.map((news) => (
              <Link 
                key={news.id} 
                to={`/news/${createNewsSlug(news.title, news.id)}`}
                className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-850 transition duration-300"
              >
                {/* Card Image */}
                <div className="h-48 overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={news.image} 
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  {(news.media_type === "video" || news.video_url) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition duration-300">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-300">
                        <Play size={22} className="fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-955 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-500 transition duration-200">
                      {news.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                      {news.short_desc}
                    </p>
                  </div>

                  <span className="text-xs text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                    Read Article &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-850">
            <p className="text-gray-400 dark:text-gray-500">No news articles found. Visit the admin panel to publish some news!</p>
            <Link 
              to="/admin/dashboard" 
              className="inline-block mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
