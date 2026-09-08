import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Rss, 
  ArrowUp, 
  ShieldCheck,
  Globe,
  Sparkles
} from "lucide-react";

// Clean inline SVG components for social links to ensure 100% build compatibility
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchFooterCategories = async () => {
      try {
        const q = query(collection(db, "categories"), where("status", "==", true), limit(8));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setCategories(list);
      } catch (err) {
        console.warn("Error fetching categories for footer:", err);
      }
    };
    fetchFooterCategories();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 transition-colors duration-300">
      {/* Top Banner / Trust Strip */}
      <div className="bg-red-600/10 dark:bg-red-950/30 border-b border-red-500/20 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <ShieldCheck size={16} />
            <span>सत्य, निष्पक्षता और सटीकता — Indiianews की पहली प्राथमिकता</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>सत्यमेव जयते</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe size={13} />
              24x7 Live News Coverage
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: About Indiianews */}
          <div className="space-y-4">
            <Link to="/" className="inline-block text-2xl font-black tracking-tighter text-red-500">
              NEWS TODAY
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Indiianews (https://indiianews.in) भारत का अग्रणी डिजिटल समाचार मंच है। हम आपको देश, दुनिया, राजनीति, खेल, और तकनीक से जुड़ी सच्ची व प्रमाणिक खबरें सबसे पहले उपलब्ध कराते हैं।
            </p>
            {/* Social Media Links */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400 block mb-2.5">
                सोशल मीडिया पर जुड़ें
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-red-600 hover:text-white flex items-center justify-center transition text-gray-400 shadow-sm"
                >
                  <YoutubeIcon />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-blue-600 hover:text-white flex items-center justify-center transition text-gray-400 shadow-sm"
                >
                  <FacebookIcon />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter X"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-black hover:text-white flex items-center justify-center transition text-gray-400 shadow-sm"
                >
                  <TwitterIcon />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-pink-600 hover:text-white flex items-center justify-center transition text-gray-400 shadow-sm"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-sky-500 hover:text-white flex items-center justify-center transition text-gray-400 shadow-sm"
                >
                  <TelegramIcon />
                </a>
                <a
                  href="/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="RSS Feed"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-amber-600 hover:text-white flex items-center justify-center transition text-gray-400 shadow-sm"
                >
                  <Rss size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Dynamic Categories */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-l-2 border-red-500 pl-2.5 mb-4">
              प्रमुख श्रेणियां (Categories)
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-gray-400 hover:text-red-400 transition flex items-center gap-1.5">
                  <span className="text-red-500">›</span> सभी समाचार (All News)
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.id}`}
                    className="text-gray-400 hover:text-red-400 transition flex items-center gap-1.5"
                  >
                    <span className="text-red-500">›</span> {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links & Legal */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-l-2 border-red-500 pl-2.5 mb-4">
              महत्वपूर्ण लिंक (Quick Links)
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-gray-400 hover:text-red-400 transition">
                  मुख्य पृष्ठ (Home)
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-red-400 transition">
                  हमारे बारे में (About Us)
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-red-400 transition">
                  संपर्क करें (Contact Desk)
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-red-400 transition">
                  गोपनीयता नीति (Privacy Policy)
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-red-400 transition">
                  नियम एवं शर्तें (Terms & Conditions)
                </Link>
              </li>
              <li>
                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-400 transition">
                  साइटमैप (XML Sitemap)
                </a>
              </li>
              <li>
                <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-400 transition">
                  RSS न्यूज़ फीड (Google News Feed)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Address & News Desk Contact */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-l-2 border-red-500 pl-2.5 mb-4">
              न्यूज़ डेस्क एवं संपर्क (Contact)
            </h4>

            <div className="flex items-start gap-2.5 text-xs text-gray-400">
              <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>
                Indiianews Digital Media Desk, नई दिल्ली एवं मुंबई, भारत (India)
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-gray-400">
              <Mail size={15} className="text-red-500 shrink-0" />
              <a href="mailto:newsdesk@indiianews.in" className="hover:text-red-400 transition">
                newsdesk@indiianews.in
              </a>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-gray-400">
              <Phone size={15} className="text-red-500 shrink-0" />
              <a href="tel:+919876543210" className="hover:text-red-400 transition">
                +91 98765 43210 (24x7 Helpline)
              </a>
            </div>

            {/* Daily Inspiration Box */}
            <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700/80 mt-4 text-[11px]">
              <span className="font-bold text-amber-400 flex items-center gap-1 mb-1">
                <Sparkles size={12} />
                दैनिक प्रेरणा
              </span>
              <p className="text-gray-300 italic">
                &ldquo;सत्य परेशान हो सकता है, पराजित नहीं।&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-gray-800 bg-gray-950/80 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} <span className="text-white font-semibold">Indiianews</span> (https://indiianews.in). सर्वाधिकार सुरक्षित।
          </div>

          <div className="flex items-center gap-6">
            <span>Made with pride in 🇮🇳 India</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-gray-800 hover:bg-red-600 hover:text-white text-gray-400 transition cursor-pointer"
              title="वापस ऊपर जाएं (Back to Top)"
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
