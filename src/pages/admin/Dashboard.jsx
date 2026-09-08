import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { updateEmail, updatePassword } from "firebase/auth";
import AdminLayout from "../../components/AdminLayout";
import { 
  Newspaper, 
  CalendarDays, 
  CalendarRange, 
  PlusCircle, 
  Settings, 
  ClipboardList, 
  Megaphone, 
  Upload, 
  Eye, 
  UserCog, 
  Trash2, 
  Plus, 
  ExternalLink,
  Sliders,
  Crop,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const Dashboard = () => {
  // Point 1: Stats without "News with Images"
  const [stats, setStats] = useState({
    totalNews: 0,
    todayNews: 0,
    latestDate: "N/A",
  });
  const [loading, setLoading] = useState(true);

  // Breaking News States
  const [breakingNewsText, setBreakingNewsText] = useState("");
  const [breakingLoading, setBreakingLoading] = useState(false);
  const [breakingSuccess, setBreakingSuccess] = useState("");
  const [breakingError, setBreakingError] = useState("");

  // Point 2 & 7: Slides States & Step-by-Step Manager
  const [slides, setSlides] = useState([]);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [slideDescription, setSlideDescription] = useState("");
  const [slideLink, setSlideLink] = useState("");
  const [slideImageType, setSlideImageType] = useState("upload"); // "upload" or "url"
  const [slideImageUrl, setSlideImageUrl] = useState("");
  const [rawImageSource, setRawImageSource] = useState(null); // DataURL or image object
  const [slideLoading, setSlideLoading] = useState(false);
  const [slideSuccess, setSlideSuccess] = useState("");
  const [slideError, setSlideError] = useState("");

  // Image Cropper & Aspect Ratio settings (Point 7)
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetY, setCropOffsetY] = useState(50); // 0 (top) to 100 (bottom)
  const [cropOffsetX, setCropOffsetX] = useState(50); // 0 (left) to 100 (right)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState("");
  const canvasRef = useRef(null);

  // Change Credentials States
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [credLoading, setCredLoading] = useState(false);
  const [credSuccess, setCredSuccess] = useState("");
  const [credError, setCredError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const newsRef = collection(db, "news");
        const querySnapshot = await getDocs(newsRef);
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push(doc.data());
        });

        const totalNews = docs.length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayNews = docs.filter((item) => {
          const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        }).length;

        let latestDate = "N/A";
        if (totalNews > 0) {
          const sorted = docs.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
            return timeB - timeA;
          });
          const latestItem = sorted[0];
          const latestVal = latestItem.createdAt?.toDate ? latestItem.createdAt.toDate() : new Date(latestItem.createdAt);
          latestDate = latestVal.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }

        setStats({ totalNews, todayNews, latestDate });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const fetchBreakingNews = async () => {
      try {
        const docRef = doc(db, "settings", "breaking");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBreakingNewsText(docSnap.data().text || "");
        }
      } catch (err) {
        console.error("Error fetching breaking news:", err);
      }
    };
    fetchBreakingNews();

    const fetchSlides = async () => {
      try {
        const q = query(collection(db, "slides"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setSlides(list);
      } catch (err) {
        console.error("Error fetching slides:", err);
      }
    };
    fetchSlides();
  }, []);

  // Update canvas preview whenever image source or crop parameters change (Point 7)
  useEffect(() => {
    if (!rawImageSource) {
      setCroppedPreviewUrl("");
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = rawImageSource;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // 16:9 banner resolution
      const targetWidth = 1280;
      const targetHeight = 720;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Compute 16:9 covering dimension
      const imgAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight;

      let drawWidth, drawHeight;
      if (imgAspect > targetAspect) {
        // Image is wider than 16:9
        drawHeight = targetHeight * cropZoom;
        drawWidth = drawHeight * imgAspect;
      } else {
        // Image is taller than 16:9
        drawWidth = targetWidth * cropZoom;
        drawHeight = drawWidth / imgAspect;
      }

      // Compute offsets based on crop sliders
      const maxOffsetX = drawWidth - targetWidth;
      const maxOffsetY = drawHeight - targetHeight;

      const posX = -(maxOffsetX * (cropOffsetX / 100));
      const posY = -(maxOffsetY * (cropOffsetY / 100));

      ctx.drawImage(img, posX, posY, drawWidth, drawHeight);

      const base64Data = canvas.toDataURL("image/jpeg", 0.75);
      setCroppedPreviewUrl(base64Data);
    };
  }, [rawImageSource, cropZoom, cropOffsetY, cropOffsetX]);

  const handleUpdateBreakingNews = async (e) => {
    e.preventDefault();
    setBreakingLoading(true);
    setBreakingSuccess("");
    setBreakingError("");

    try {
      const docRef = doc(db, "settings", "breaking");
      await setDoc(docRef, {
        text: breakingNewsText,
        updatedAt: new Date(),
      }, { merge: true });
      setBreakingSuccess("Breaking news updated!");
      setTimeout(() => setBreakingSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating breaking news:", err);
      setBreakingError("Failed to update.");
    } finally {
      setBreakingLoading(false);
    }
  };

  const handleSlideImageFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImageSource(e.target.result);
      setCropZoom(1);
      setCropOffsetY(50);
      setCropOffsetX(50);
    };
    reader.readAsDataURL(file);
  };

  const handleSlideImageUrlBlur = () => {
    if (slideImageUrl.trim()) {
      setRawImageSource(slideImageUrl.trim());
      setCropZoom(1);
      setCropOffsetY(50);
      setCropOffsetX(50);
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    setSlideLoading(true);
    setSlideSuccess("");
    setSlideError("");

    try {
      const finalImage = croppedPreviewUrl || rawImageSource;
      if (!finalImage) {
        throw new Error("कृपया स्लाइड की छवि चुनें (Please select or crop an image).");
      }

      await addDoc(collection(db, "slides"), {
        image: finalImage,
        link: slideLink.trim() || "",
        description: slideDescription.trim() || "",
        createdAt: new Date(),
      });

      setSlideSuccess("सफलतापूर्वक स्लाइड जोड़ी गई! (Slide added successfully)");
      setSlideDescription("");
      setSlideLink("");
      setSlideImageUrl("");
      setRawImageSource(null);
      setCroppedPreviewUrl("");
      setShowAddSlide(false);

      // Refresh slides list immediately
      const q = query(collection(db, "slides"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSlides(list);

      setTimeout(() => setSlideSuccess(""), 4000);
    } catch (err) {
      console.error("Error adding slide:", err);
      setSlideError(err.message || "Failed to add slide.");
    } finally {
      setSlideLoading(false);
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm("क्या आप वाकई इस स्लाइड को हटाना चाहते हैं? (Delete this slide?)")) return;
    try {
      await deleteDoc(doc(db, "slides", slideId));
      setSlides((prev) => prev.filter((slide) => slide.id !== slideId));
    } catch (err) {
      console.error("Error deleting slide:", err);
      alert("Failed to delete slide.");
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredLoading(true);
    setCredSuccess("");
    setCredError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found.");
      }

      if (newEmail.trim() && newEmail.trim() !== user.email) {
        await updateEmail(user, newEmail.trim());
      }

      if (newPassword.trim()) {
        await updatePassword(user, newPassword.trim());
      }

      setCredSuccess("Credentials updated successfully!");
      setNewEmail("");
      setNewPassword("");
    } catch (err) {
      console.error("Error updating credentials:", err);
      if (err.code === "auth/requires-recent-login") {
        setCredError("For security, please log out and log back in, then try again.");
      } else {
        setCredError(err.message || "Failed to update credentials.");
      }
    } finally {
      setCredLoading(false);
    }
  };

  // Point 1: Clean 3-card stats layout without "News with Images"
  const statCards = [
    { title: "Total News (कुल समाचार)", value: stats.totalNews, icon: Newspaper, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
    { title: "Today's News (आज के समाचार)", value: stats.todayNews, icon: CalendarDays, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
    { title: "Latest News Date (नवीनतम तिथि)", value: stats.latestDate, icon: CalendarRange, color: "text-red-600 bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            📊 Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of your news channel metrics and management tools
          </p>
        </div>

        {/* Stats Grid - Balanced 3 Columns (Point 1) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-white dark:bg-gray-800 h-32 rounded-2xl shadow-sm border border-gray-250/60 dark:border-gray-700"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-750 hover:shadow-md transition flex items-center gap-5"
                >
                  <div className={`p-4 rounded-xl ${card.color}`}>
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                      {card.value}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                      {card.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Management Links */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-750">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Link
              to="/admin/add-news"
              className="flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl font-bold transition text-center border border-red-100/50 dark:border-red-950/25 group"
            >
              <PlusCircle size={30} className="group-hover:scale-110 transition duration-200" />
              <span className="mt-3 text-sm">Publish News (नया समाचार)</span>
            </Link>

            <Link
              to="/admin/manage-news"
              className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl font-bold transition text-center border border-blue-100/50 dark:border-blue-950/25 group"
            >
              <ClipboardList size={30} className="group-hover:scale-110 transition duration-200" />
              <span className="mt-3 text-sm">Manage News (समाचार सूची)</span>
            </Link>

            <Link
              to="/admin/manage-categories"
              className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100/70 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl font-bold transition text-center border border-purple-100/50 dark:border-purple-950/25 group"
            >
              <Settings size={30} className="group-hover:scale-110 transition duration-200" />
              <span className="mt-3 text-sm">Configure Categories</span>
            </Link>
          </div>
        </div>

        {/* Breaking News Ticker Manager */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-750">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
            <Megaphone className="text-red-600 dark:text-red-500 animate-bounce" size={18} />
            Breaking News Ticker (ब्रेकिंग न्यूज़ टिकर)
          </h3>
          <form onSubmit={handleUpdateBreakingNews} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Marquee Text
              </label>
              <textarea
                required
                value={breakingNewsText}
                onChange={(e) => setBreakingNewsText(e.target.value)}
                placeholder="Enter breaking news marquee text..."
                rows={2}
                className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Tip: Use bullet symbols (•) to separate multiple news alerts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={breakingLoading}
                className="py-2 px-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {breakingLoading ? "Updating..." : "Update Ticker"}
              </button>
              {breakingSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-fadeIn">
                  ✓ {breakingSuccess}
                </span>
              )}
              {breakingError && (
                <span className="text-xs text-red-600 dark:text-red-400 font-bold animate-fadeIn">
                  ✗ {breakingError}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Scheme Slides Manager (Points 2 & 7: Compact Row Layout + Image Cropper) */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-750">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="text-red-600 dark:text-red-500" size={18} />
                Scheme Slides Manager ({slides.length} Slides)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Compact slide list for the homepage carousel with 16:9 ratio image fit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddSlide((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm w-fit"
            >
              {showAddSlide ? (
                <>
                  <ChevronUp size={14} /> Close Form
                </>
              ) : (
                <>
                  <Plus size={14} /> + Add Slide (नया स्लाइड जोड़ें)
                </>
              )}
            </button>
          </div>

          {slideSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check size={14} />
              {slideSuccess}
            </div>
          )}

          {/* Collapsible Step-by-Step Slide Creator (Point 2 & 7) */}
          {showAddSlide && (
            <div className="mt-6 p-5 sm:p-6 bg-gray-50 dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-750 pb-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <Crop size={14} /> Step 1: Slide Details & 16:9 Image Crop
                </h4>
                <span className="text-[11px] text-gray-400">Target Ratio: 16:9 Banner</span>
              </div>

              <form onSubmit={handleSaveSlide} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Short Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Short Description / Title (विवरण) *
                    </label>
                    <input
                      type="text"
                      required
                      value={slideDescription}
                      onChange={(e) => setSlideDescription(e.target.value)}
                      placeholder="e.g. कौशल युवा से बनता विकसित भारत"
                      className="block w-full px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-xs transition"
                    />
                  </div>

                  {/* Redirect URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Redirect URL / Link (वेबसाइट लिंक) *
                    </label>
                    <input
                      type="url"
                      required
                      value={slideLink}
                      onChange={(e) => setSlideLink(e.target.value)}
                      placeholder="e.g. https://pmkivy.gov.in"
                      className="block w-full px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-xs transition"
                    />
                  </div>
                </div>

                {/* Image Source Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Image Source:</span>
                    <button
                      type="button"
                      onClick={() => setSlideImageType("upload")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        slideImageType === "upload"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideImageType("url")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        slideImageType === "url"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      Image URL
                    </button>
                  </div>

                  {slideImageType === "upload" ? (
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-800">
                      <label className="cursor-pointer text-center text-xs text-gray-600 dark:text-gray-300">
                        <Upload className="mx-auto h-5 w-5 text-gray-400 mb-1" />
                        <span className="font-bold text-red-600 dark:text-red-400">Click to choose image</span> (JPG, PNG, WebP)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSlideImageFileChange(e.target.files[0])}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={slideImageUrl}
                      onChange={(e) => setSlideImageUrl(e.target.value)}
                      onBlur={handleSlideImageUrlBlur}
                      placeholder="Paste image URL here (e.g. https://.../image.jpg)"
                      className="block w-full px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-xs transition"
                    />
                  )}
                </div>

                {/* Point 7: Interactive 16:9 Canvas Crop Tool */}
                {rawImageSource && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-250 dark:border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                        <Sliders size={13} className="text-red-500" />
                        16:9 Ratio Adjuster (अनुपात समायोजन)
                      </div>
                      <span className="text-[10px] text-gray-400">Adjust zoom & position to fit slide banner</span>
                    </div>

                    {/* Live 16:9 Crop Preview */}
                    <div className="relative w-full max-w-md mx-auto aspect-video rounded-xl overflow-hidden shadow-inner bg-black border border-gray-300 dark:border-gray-700">
                      {croppedPreviewUrl ? (
                        <img
                          src={croppedPreviewUrl}
                          alt="16:9 Slide Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500">
                          Processing 16:9 Preview...
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                        16:9 Banner Preview
                      </div>
                    </div>

                    {/* Crop Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                          <span>Zoom</span>
                          <span>{cropZoom.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.05"
                          value={cropZoom}
                          onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                          className="w-full accent-red-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                          <span>Vertical Position</span>
                          <span>{cropOffsetY}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={cropOffsetY}
                          onChange={(e) => setCropOffsetY(parseInt(e.target.value, 10))}
                          className="w-full accent-red-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                          <span>Horizontal Position</span>
                          <span>{cropOffsetX}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={cropOffsetX}
                          onChange={(e) => setCropOffsetX(parseInt(e.target.value, 10))}
                          className="w-full accent-red-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {slideError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                    ✗ {slideError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={slideLoading || (!rawImageSource && !croppedPreviewUrl)}
                    className="py-2 px-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {slideLoading ? "Saving Slide..." : "Save & Add Next (स्लाइड सहेजें)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSlide(false);
                      setRawImageSource(null);
                      setCroppedPreviewUrl("");
                    }}
                    className="py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Compact Horizontal Row / Table Layout for Existing Slides (Point 2) */}
          <div className="mt-6">
            {slides.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No slides uploaded yet. Click "+ Add Slide" above to add your first scheme banner.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Slide Preview</th>
                      <th className="py-2.5 px-3">Description & Link</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {slides.map((slide) => (
                      <tr key={slide.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-900/40 transition">
                        <td className="py-2.5 px-3 w-28">
                          <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black/10 dark:bg-black/40 border border-gray-200 dark:border-gray-750">
                            <img
                              src={slide.image}
                              alt={slide.description}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs sm:max-w-md">
                          <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                            {slide.description || "Scheme Slide"}
                          </p>
                          {slide.link && (
                            <a
                              href={slide.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-500 hover:text-red-600 font-medium inline-flex items-center gap-1 truncate max-w-xs mt-0.5"
                            >
                              <ExternalLink size={10} />
                              <span className="truncate">{slide.link}</span>
                            </a>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                          {slide.createdAt?.toDate
                            ? slide.createdAt.toDate().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                            : "Recent"}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                            title="Delete Slide"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Change Login Credentials Card */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-750">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 inline-flex items-center gap-2">
            <UserCog size={18} className="text-red-500" />
            Update Login Credentials
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Modify the admin login email and password. Leaving a field blank will keep it unchanged.
          </p>

          <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new-email@news.com"
                className="block w-full px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-xs transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-xs transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={credLoading}
                className="py-2 px-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm"
              >
                {credLoading ? "Updating..." : "Update Credentials"}
              </button>
              {credSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-fadeIn">
                  ✓ {credSuccess}
                </span>
              )}
              {credError && (
                <span className="text-xs text-red-600 dark:text-red-400 font-bold animate-fadeIn">
                  ✗ {credError}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
