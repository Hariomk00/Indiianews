import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import AdminLayout from "../../components/AdminLayout";
import { ArrowLeft, Save, Upload, Eye, Sparkles, RefreshCw, Video, Image as ImageIcon, Play, Check, FileVideo, Globe, HardDrive } from "lucide-react";
import { slugify } from "../../utils/slugify";

// Helper function to extract YouTube video ID from various YouTube URL formats
export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Helper function to strip basic markdown tags for clean plaintext presentation
const cleanMarkdownToPlainText = (markdown) => {
  if (!markdown) return "";
  
  let text = markdown;
  
  text = text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^(#+)\s+(.*)$/gm, "$2")
    .replace(/^([^\n]+)\n[=-]+\s*$/gm, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*>\s+/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
    
  return text;
};

// Helper function to compress and convert image files to base64 Data URIs
const compressAndConvertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const AddEditNews = () => {
  const { id } = useParams(); // If present, we are editing
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullContent, setFullContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  // Point 4: Media Type & Local Video Upload states
  const [mediaType, setMediaType] = useState("image");
  const [videoSourceType, setVideoSourceType] = useState("url"); // "url" or "upload"
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoLocalPreview, setVideoLocalPreview] = useState("");
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [useAutoYoutubeThumb, setUseAutoYoutubeThumb] = useState(true);

  const [imageType, setImageType] = useState("upload"); // "upload" or "url"
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sourceUrl, setSourceUrl] = useState("");
  const [fetchingFullContent, setFetchingFullContent] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Function to manually extract full content from a URL
  const fetchFullContent = async (urlToFetch) => {
    const targetUrl = urlToFetch || sourceUrl;
    if (!targetUrl) return;

    setFetchingFullContent(true);
    setFetchError("");
    try {
      const response = await fetch(`https://r.jina.ai/${targetUrl.trim()}`, {
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to extract article (status: ${response.status})`);
      }
      
      const result = await response.json();
      if (result && result.data && result.data.content) {
        const cleanedText = cleanMarkdownToPlainText(result.data.content);
        
        if (!title.trim() && result.data.title) {
          setTitle(result.data.title);
        }
        if (!shortDesc.trim() && result.data.description) {
          setShortDesc(result.data.description);
        }
        
        const authorInfo = location.state?.prefilledNews?.author || "Original Source";
        const finalContent = `${cleanedText}\n\n---\nSource: ${authorInfo} - Read full article: ${targetUrl}`;
        setFullContent(finalContent);
      } else {
        throw new Error("No readable content returned from extraction service.");
      }
    } catch (err) {
      console.error("Error fetching full text:", err);
      setFetchError(err.message || "Failed to extract article content.");
    } finally {
      setFetchingFullContent(false);
    }
  };

  useEffect(() => {
    // 1. Fetch active categories for dropdown
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), where("status", "==", true));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCategories(list);
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("Failed to load category list.");
      }
    };
    fetchCategories();

    // Prefill form details if passed via navigation state (from Import page)
    if (!isEdit && location.state?.prefilledNews) {
      const { title, short_desc, full_content, image, url } = location.state.prefilledNews;
      setTitle(title || "");
      setShortDesc(short_desc || "");
      setFullContent(full_content || "");
      if (image) {
        setImageType("url");
        setImageUrl(image);
      }
      if (url) {
        setSourceUrl(url);
        const autoFetch = async () => {
          setFetchingFullContent(true);
          setFetchError("");
          try {
            const response = await fetch(`https://r.jina.ai/${url.trim()}`, {
              headers: { "Accept": "application/json" }
            });
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const result = await response.json();
            if (result?.data?.content) {
              const cleanedText = cleanMarkdownToPlainText(result.data.content);
              const authorInfo = location.state?.prefilledNews?.author || "Original Source";
              setFullContent(`${cleanedText}\n\n---\nSource: ${authorInfo} - Read full article: ${url}`);
            }
          } catch (err) {
            console.error("Auto-fetch error:", err);
            setFetchError("Failed to auto-extract full content.");
          } finally {
            setFetchingFullContent(false);
          }
        };
        autoFetch();
      }
    }

    // 2. Fetch news data if editing
    if (isEdit) {
      const fetchNewsDetails = async () => {
        try {
          const docRef = doc(db, "news", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTitle(data.title || "");
            setShortDesc(data.short_desc || "");
            setFullContent(data.full_content || "");
            setCategoryId(data.category_id || "");
            setExistingImageUrl(data.image || "");
            setSourceUrl(data.source_url || "");

            // Check if article was saved as video
            if (data.media_type === "video" || data.video_url) {
              setMediaType("video");
              setVideoUrl(data.video_url || "");
              if (data.video_url && !data.video_url.includes("youtube") && !data.video_url.includes("youtu.be")) {
                setVideoSourceType("upload");
                setVideoLocalPreview(data.video_url);
              } else {
                setVideoSourceType("url");
              }
            } else {
              setMediaType("image");
            }

            if (data.image && !data.image.includes("firebasestorage.googleapis.com")) {
              setImageType("url");
              setImageUrl(data.image);
            } else {
              setImageType("upload");
            }
          } else {
            setError("News article not found.");
          }
        } catch (err) {
          console.error("Error loading news article details:", err);
          setError("Failed to load news details.");
        } finally {
          setPageLoading(false);
        }
      };
      fetchNewsDetails();
    }
  }, [id, isEdit, location.state]);

  // Handle YouTube Video URL changes and auto-extract thumbnail (Point 5)
  const youtubeId = getYouTubeVideoId(videoUrl);
  const autoYoutubeThumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : "";

  // Sync image preview reactively based on mediaType, image type, and selections
  useEffect(() => {
    let objectUrl = "";

    if (mediaType === "video" && useAutoYoutubeThumb && autoYoutubeThumbnail) {
      setImagePreview(autoYoutubeThumbnail);
      return;
    }

    if (imageType === "upload") {
      if (imageFile) {
        objectUrl = URL.createObjectURL(imageFile);
        setImagePreview(objectUrl);
      } else {
        setImagePreview(existingImageUrl);
      }
    } else {
      setImagePreview(imageUrl || existingImageUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [mediaType, useAutoYoutubeThumb, autoYoutubeThumbnail, imageType, imageFile, imageUrl, existingImageUrl]);

  useEffect(() => {
    return () => {
      if (videoLocalPreview && videoLocalPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoLocalPreview);
      }
    };
  }, [videoLocalPreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError("वीडियो फ़ाइल 100MB से कम होनी चाहिए (Video file must be under 100MB).");
        return;
      }
      setVideoFile(file);
      const objUrl = URL.createObjectURL(file);
      setVideoLocalPreview(objUrl);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (categoryId === "") {
      setError("Please select a category.");
      setLoading(false);
      return;
    }

    if (mediaType === "video") {
      if (videoSourceType === "url" && !videoUrl.trim()) {
        setError("कृपया वीडियो URL दर्ज करें (Please provide a video URL).");
        setLoading(false);
        return;
      }
      if (videoSourceType === "upload" && !videoFile && !videoUrl.trim()) {
        setError("कृपया स्थानीय स्टोरेज से एक वीडियो फ़ाइल चुनें (Please select a video file to upload).");
        setLoading(false);
        return;
      }
    }

    try {
      let finalVideoUrl = videoUrl.trim();

      // Handle local video file upload to Firebase Storage
      if (mediaType === "video" && videoSourceType === "upload" && videoFile) {
        setVideoUploading(true);
        try {
          const safeName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storageRef = ref(storage, `videos/${Date.now()}_${safeName}`);
          const uploadTask = uploadBytesResumable(storageRef, videoFile);

          finalVideoUrl = await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setVideoUploadProgress(progress);
              },
              (err) => reject(err),
              async () => {
                try {
                  const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadUrl);
                } catch (urlErr) {
                  reject(urlErr);
                }
              }
            );
          });
        } catch (uploadErr) {
          console.error("Firebase Storage video upload error:", uploadErr);
          setError(`वीडियो अपलोड विफल: ${uploadErr.message || "Storage error. Please verify Firebase Storage rules."}`);
          setLoading(false);
          setVideoUploading(false);
          return;
        } finally {
          setVideoUploading(false);
        }
      }

      let finalImageUrl = existingImageUrl;

      if (mediaType === "video" && videoSourceType === "url" && useAutoYoutubeThumb && autoYoutubeThumbnail) {
        // Automatically use the full resolution YouTube thumbnail
        finalImageUrl = autoYoutubeThumbnail;
      } else if (imageType === "upload") {
        if (imageFile) {
          if (isEdit && existingImageUrl && existingImageUrl.startsWith("http") && existingImageUrl.includes("firebasestorage.googleapis.com")) {
            try {
              const oldImageRef = ref(storage, existingImageUrl);
              await deleteObject(oldImageRef);
            } catch (storageErr) {
              console.warn("Failed to delete old image from storage:", storageErr);
            }
          }

          try {
            finalImageUrl = await compressAndConvertToBase64(imageFile);
          } catch (compressErr) {
            console.error("Failed to process image:", compressErr);
            setError("Failed to process and compress the uploaded image.");
            setLoading(false);
            return;
          }
        }
      } else {
        finalImageUrl = imageUrl.trim() || autoYoutubeThumbnail;
      }

      if (!finalImageUrl && !isEdit) {
        setError("कृपया समाचार के लिए थंबनेल छवि या मान्य वीडियो प्रदान करें (Please provide a thumbnail image or valid video).");
        setLoading(false);
        return;
      }

      const newsData = {
        title,
        slug: slugify(title),
        short_desc: shortDesc,
        full_content: fullContent,
        category_id: categoryId,
        image: finalImageUrl,
        source_url: sourceUrl.trim() || "",
        media_type: mediaType,
        video_url: mediaType === "video" ? finalVideoUrl : "",
      };

      if (isEdit) {
        const docRef = doc(db, "news", id);
        await updateDoc(docRef, {
          ...newsData,
          updatedAt: new Date(),
        });
        setSuccess("News article updated successfully!");
      } else {
        await addDoc(collection(db, "news"), {
          ...newsData,
          createdAt: new Date(),
        });
        setSuccess("News article published successfully!");
        setTitle("");
        setShortDesc("");
        setFullContent("");
        setCategoryId("");
        setImageFile(null);
        setImageUrl("");
        setImagePreview("");
        setVideoFile(null);
        setVideoUrl("");
        setVideoLocalPreview("");
        setVideoUploadProgress(0);
        setSourceUrl("");
        setFetchError("");
      }

      setTimeout(() => {
        navigate("/admin/manage-news");
      }, 1500);
    } catch (err) {
      console.error("Error saving news article:", err);
      setError("An error occurred while saving the news article.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/manage-news"
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition shadow-sm"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                {isEdit ? "✏️ Edit News Article" : "📰 Publish News Article"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Create standard articles or embed video news with automatic thumbnail extraction
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-semibold rounded-2xl animate-shake">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-2xl animate-fadeIn">
            {success}
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-150 dark:border-gray-750">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Point 5: Media Type Selector */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                Article Media Format (समाचार प्रारूप)
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setMediaType("image")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    mediaType === "image"
                      ? "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <ImageIcon size={16} />
                  <span>📷 Standard Image Article</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType("video")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    mediaType === "video"
                      ? "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600 dark:text-red-400 shadow-sm"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <Video size={16} />
                  <span>🎥 Video News (वीडियो समाचार)</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Headline / Title (शीर्षक) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter headline in Hindi or English..."
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition"
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Short Description (संक्षिप्त विवरण) *
              </label>
              <textarea
                required
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Brief 1-2 line summary of the story..."
                rows={2}
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition resize-none"
              />
            </div>

            {/* Source URL & Content Auto-Extractor */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Source Reference URL (Optional)
                </label>
                {sourceUrl && (
                  <button
                    type="button"
                    onClick={() => fetchFullContent(sourceUrl)}
                    disabled={fetchingFullContent}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles size={14} className={fetchingFullContent ? "animate-pulse" : ""} />
                    {fetchingFullContent ? "Extracting..." : "Auto-Extract Content"}
                  </button>
                )}
              </div>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/news-article-url"
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition"
              />
            </div>

            {/* Full News Content */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Full News Content (विस्तृत समाचार) *
                </label>
                {fetchingFullContent && (
                  <span className="text-xs font-bold text-amber-500 dark:text-amber-400 animate-pulse flex items-center gap-1">
                    <RefreshCw size={12} className="animate-spin" />
                    Extracting article body...
                  </span>
                )}
                {fetchError && (
                  <span className="text-xs font-bold text-red-500 dark:text-red-400">
                    ⚠️ {fetchError}
                  </span>
                )}
              </div>
              <textarea
                required
                value={fullContent}
                onChange={(e) => setFullContent(e.target.value)}
                placeholder="Write the complete news article details here..."
                disabled={fetchingFullContent}
                rows={8}
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none sm:text-sm transition resize-y"
              />
            </div>

            {/* Category Select Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Select Category (श्रेणी चुनें) *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Point 4 & 5: Video News Source & Local Video Upload */}
            {mediaType === "video" && (
              <div className="p-5 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-100 dark:border-red-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Video size={18} className="text-red-600 dark:text-red-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Video Source (वीडियो स्रोत)
                    </h4>
                  </div>

                  {/* Mode Toggle: YouTube vs Local Video File */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setVideoSourceType("url")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        videoSourceType === "url"
                          ? "bg-red-600 text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      <Globe size={13} />
                      <span>YouTube / Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType("upload")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        videoSourceType === "upload"
                          ? "bg-red-600 text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      <HardDrive size={13} />
                      <span>Upload Video File (लोकल फ़ाइल)</span>
                    </button>
                  </div>
                </div>

                {videoSourceType === "url" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Video URL (YouTube, Vimeo, or Direct MP4 link) *
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                        className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-xs transition"
                      />
                    </div>

                    {youtubeId && (
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <Check size={14} />
                        <span>YouTube Video ID detected: <strong className="font-mono">{youtubeId}</strong>. Full high-res thumbnail extracted automatically!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Select Video File from Computer / Phone (स्थानीय स्टोरेज से वीडियो चुनें) *
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-650 rounded-xl cursor-pointer hover:border-red-500 transition text-xs font-bold text-gray-700 dark:text-gray-300">
                          <FileVideo size={16} className="text-red-500" />
                          <span>{videoFile ? videoFile.name : "Choose Video (.mp4, .webm, .mov)"}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={handleVideoFileChange}
                            className="hidden"
                          />
                        </label>
                        {videoFile && (
                          <span className="text-[11px] text-gray-500">
                            Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Local Video Player Preview */}
                    {(videoLocalPreview || videoUrl) && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          Video Player Preview:
                        </span>
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black aspect-video max-w-md shadow-inner">
                          <video
                            src={videoLocalPreview || videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}

                    {/* Upload progress indicator */}
                    {videoUploading && (
                      <div className="space-y-1 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-750">
                        <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                          <span>Uploading video to storage...</span>
                          <span className="text-red-600 dark:text-red-400">{videoUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-red-600 h-2 transition-all duration-300 rounded-full"
                            style={{ width: `${videoUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail / Image Controls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {mediaType === "video" ? "Video Thumbnail (वीडियो थंबनेल)" : "Featured Image (विशेष छवि) *"}
                </label>
                {mediaType === "video" && videoSourceType === "url" && youtubeId && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAutoYoutubeThumb}
                      onChange={(e) => setUseAutoYoutubeThumb(e.target.checked)}
                      className="rounded accent-red-600"
                    />
                    <span>Use YouTube high-res thumbnail</span>
                  </label>
                )}
              </div>

              {(!useAutoYoutubeThumb || mediaType === "image" || videoSourceType === "upload") && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl max-w-xs border border-gray-200 dark:border-gray-750">
                    <button
                      type="button"
                      onClick={() => setImageType("upload")}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        imageType === "upload"
                          ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageType("url")}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        imageType === "url"
                          ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      Image URL
                    </button>
                  </div>

                  {imageType === "upload" ? (
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-900">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                          <label className="relative cursor-pointer rounded-md font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus-within:outline-none">
                            <span>Upload an image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              required={!isEdit && !existingImageUrl && mediaType === "image"}
                              className="sr-only"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="url"
                      required={!isEdit && !existingImageUrl && mediaType === "image"}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Image / Video Thumbnail Preview */}
            {imagePreview && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail Preview (थंबनेल पूर्वावलोकन)
                </label>
                <div className="relative rounded-2xl overflow-hidden shadow-md max-w-sm border border-gray-200 dark:border-gray-750 bg-black">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      if (youtubeId) {
                        e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                      } else {
                        e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                      }
                    }}
                    className="w-full h-48 object-cover"
                  />
                  {mediaType === "video" && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play size={22} className="fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1 text-[10px]">
                    <Eye size={10} /> Live Preview
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              <Save size={18} />
              {loading ? "Saving article..." : isEdit ? "Update Article" : "Publish Article"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddEditNews;
