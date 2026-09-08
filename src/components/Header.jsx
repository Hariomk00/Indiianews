import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { Search, Moon, Sun, Languages, ChevronDown } from "lucide-react";
import SearchModal from "./SearchModal";
import DailyQuote from "./DailyQuote";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी" },
  { code: "mr", name: "मराठी" },
  { code: "gu", name: "ગુજરાਤੀ" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "bn", name: "বাংলা" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "ml", name: "മലയാളം" }
];

const Header = () => {
  const [categories, setCategories] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [clickTimes, setClickTimes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  const getLanguageFromCookie = () => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    return match ? match[1] : "en";
  };

  const handleLanguageChange = (langCode) => {
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.indiianews.in;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=localhost;`;

    const selectEl = document.querySelector(".goog-te-combo");
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event("change"));
    } else {
      window.location.reload();
    }
    setCurrentLang(langCode);
  };

  const handleLogoClick = (e) => {
    const now = Date.now();
    const recentClicks = [...clickTimes, now].filter((t) => now - t < 1500);

    if (recentClicks.length >= 3) {
      e.preventDefault();
      setClickTimes([]);
      if (currentUser) {
        navigate("/admin/dashboard");
      } else {
        navigate("/admin/login");
      }
    } else {
      setClickTimes(recentClicks);
    }
  };

  useEffect(() => {
    // Load categories
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), where("status", "==", true));
        const querySnapshot = await getDocs(q);
        const cats = [];
        querySnapshot.forEach((doc) => {
          cats.push({ id: doc.id, ...doc.data() });
        });
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories for header:", error);
      }
    };
    fetchCategories();

    // Check existing dark mode setting
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    // Setup Google Translate Script dynamically
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          },
          "google_translate_element"
        );
      };
    }

    const checkCookie = () => {
      const lang = getLanguageFromCookie();
      setCurrentLang(lang);
    };
    checkCookie();
    const interval = setInterval(checkCookie, 1000);

    return () => {
      unsubscribeAuth();
      clearInterval(interval);
    };
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="text-2xl font-black tracking-tighter text-red-600 dark:text-red-500 hover:opacity-90">
            NEWS TODAY
          </Link>

          {/* Navigation - Categories */}
          <nav className="hidden md:flex space-x-6 overflow-x-auto py-2">
            <Link
              to="/"
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                location.pathname === "/"
                  ? "text-red-600 dark:text-red-500"
                  : "text-gray-600 dark:text-gray-300 hover:text-red-500"
              }`}
            >
              All News
            </Link>
            {categories.map((cat) => {
              const catPath = `/category/${cat.id}`;
              const isActive = location.pathname === catPath;
              return (
                <Link
                  key={cat.id}
                  to={catPath}
                  className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "text-red-600 dark:text-red-500"
                      : "text-gray-600 dark:text-gray-300 hover:text-red-500"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all cursor-pointer"
              title="Search Categories"
            >
              <Search size={20} />
            </button>

            {/* Custom Language Translation Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-2 flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all cursor-pointer"
                title="Translate Language"
              >
                <Languages size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-800">
                  {currentLang}
                </span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`} />
              </button>

              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-fadeIn max-h-64 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          handleLanguageChange(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between ${
                          currentLang === lang.code ? "text-red-600 dark:text-red-500 bg-red-50/30 dark:bg-red-950/20" : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <span>{lang.name}</span>
                        {currentLang === lang.code && (
                          <span className="w-1.5 h-1.5 bg-red-650 dark:bg-red-500 rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all cursor-pointer"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex space-x-4 overflow-x-auto px-4 py-2 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-900">
          <Link
            to="/"
            className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
              location.pathname === "/"
                ? "text-red-600 dark:text-red-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            All News
          </Link>
          {categories.map((cat) => {
            const catPath = `/category/${cat.id}`;
            const isActive = location.pathname === catPath;
            return (
              <Link
                key={cat.id}
                to={catPath}
                className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                  isActive
                    ? "text-red-600 dark:text-red-500"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Point 4: Strictly One Hindi Quote of the Day */}
      <DailyQuote />

      {/* Category Search Modal */}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}

      {/* Hidden container for Google Translate Widget */}
      <div id="google_translate_element" className="hidden"></div>
    </>
  );
};

export default Header;
