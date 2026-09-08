import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { X } from "lucide-react";
import DailyQuote from "./DailyQuote";

// Helper to generate a random hex color code
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Component to render text with randomized letter colors
const ColorfulText = ({ text }) => {
  return (
    <span>
      {text.split("").map((char, index) => {
        const color = getRandomColor();
        return (
          <span
            key={index}
            style={{ color }}
            className="font-extrabold text-lg select-none"
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

const SearchModal = ({ onClose }) => {
  const [keyword, setKeyword] = useState("");
  const [categories, setCategories] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load all active categories on mount
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const q = query(collection(db, "categories"), where("status", "==", true));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setCategories(list);
      } catch (error) {
        console.error("Error loading categories for search:", error);
      }
    };
    fetchAllCategories();

    // Auto focus the search input
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, []);

  // Filter categories when keyword changes
  useEffect(() => {
    if (keyword.trim() === "") {
      setFilteredResults([]);
      return;
    }

    const term = keyword.toLowerCase();
    // Matches categories starting with search term (mimicking LIKE LOWER('q%'))
    const matches = categories.filter((c) =>
      c.name.toLowerCase().startsWith(term)
    );
    setFilteredResults(matches);
  }, [keyword, categories]);

  // Handle keyboard keys (Escape & Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Enter" && filteredResults.length > 0) {
        // Navigate to the first result on Enter key press
        const firstId = filteredResults[0].id;
        navigate(`/category/${firstId}`);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredResults, navigate, onClose]);

  const handleResultClick = (id) => {
    navigate(`/category/${id}`);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-scaleIn transition-all">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search category (e.g. Sports, Politics...)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-1 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium text-lg focus:ring-0"
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {keyword.trim() === "" ? (
            <div className="p-4 space-y-4">
              <DailyQuote variant="compact" />
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-1">
                श्रेणी खोजने के लिए नाम टाइप करें (Type category name to search)...
              </p>
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleResultClick(cat.id)}
                className="px-5 py-4 cursor-pointer hover:bg-red-50/40 dark:hover:bg-gray-750 transition flex items-center justify-between"
              >
                <ColorfulText text={cat.name} />
                <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                  View Category
                </span>
              </div>
            ))
          ) : (
            <div className="py-8 px-4 text-center text-sm text-gray-400 dark:text-gray-500">
              No matching categories found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
