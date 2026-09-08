import React, { useState } from "react";
import { Sparkles, Quote, Copy, Check, Share2 } from "lucide-react";

// Curated library of profound Hindi quotes (Suvichar) from revered thinkers & texts
export const quotes = [
  {
    quote: "उठो, जागो और तब तक मत रुको जब तक लक्ष्य की प्राप्ति न हो जाए।",
    author: "स्वामी विवेकानंद"
  },
  {
    quote: "सपने वो नहीं जो हम सोते हुए देखते हैं, सपने वो हैं जो हमें सोने नहीं देते।",
    author: "डॉ. एपीजे अब्दुल कलाम"
  },
  {
    quote: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। कर्म करो, फल की चिंता मत करो।",
    author: "श्रीमद्भगवद्गीता"
  },
  {
    quote: "शिक्षा सबसे शक्तिशाली हथियार है जिसे आप दुनिया को बदलने के लिए इस्तेमाल कर सकते हैं।",
    author: "नेल्सन मंडेला"
  },
  {
    quote: "मनुष्य अपने विचारों से ही बनता है, वो जैसा सोचता है, वैसा ही बन जाता है।",
    author: "महात्मा गांधी"
  },
  {
    quote: "असंभव शब्द का प्रयोग केवल कायर करते हैं, बहादुर और बुद्धिमान व्यक्ति अपना मार्ग स्वयं बनाते हैं।",
    author: "चाणक्य"
  },
  {
    quote: "क्रोध को पाले रखना गर्म कोयले को किसी और पर फेंकने की नीयत से पकड़े रहने के समान है; इसमें आप ही जलते हैं।",
    author: "गौतम बुद्ध"
  },
  {
    quote: "पोथी पढ़ि पढ़ि जग मुआ, पंडित भया न कोय। ढाई आखर प्रेम का, पढ़े सो पंडित होय।",
    author: "कबीर दास"
  },
  {
    quote: "विश्वास वह शक्ति है जिससे उजड़ी हुई दुनिया में भी प्रकाश लाया जा सकता है।",
    author: "हेलेन केलर"
  },
  {
    quote: "यदि आप समय पर अपनी गलती स्वीकार नहीं करते हैं, तो आप एक और गलती करते हैं।",
    author: "रविंद्रनाथ टैगोर"
  },
  {
    quote: "सफलता हमारा परिचय दुनिया को करवाती है, और असफलता हमें दुनिया का परिचय करवाती है।",
    author: "अज्ञात"
  },
  {
    quote: "महान कार्य करने का एकमात्र तरीका यह है कि आप जो करते हैं उससे प्यार करें।",
    author: "स्टीव जॉब्स"
  },
  {
    quote: "धैर्य रखना कड़वा है, लेकिन इसका फल सदैव मीठा होता है।",
    author: "अरस्तू"
  },
  {
    quote: "जब तक आप अपनी समस्याओं और कठिनाइयों की वजह दूसरों को मानते हैं, तब तक आप उन्हें मिटा नहीं सकते।",
    author: "कन्फ्यूशियस"
  },
  {
    quote: "जो व्यक्ति अपनी गलतियों से सीखता है और आगे बढ़ता है, वही जीवन में सफल होता है।",
    author: "डॉ. बी. आर. अम्बेडकर"
  },
  {
    quote: "सत्य से बड़ा कोई धर्म नहीं है, और झूठ से बड़ा कोई पाप नहीं।",
    author: "तुलसीदास"
  },
  {
    quote: "इंतजार करने वालों को सिर्फ उतना ही मिलता है, जितना कोशिश करने वाले छोड़ देते हैं।",
    author: "डॉ. एपीजे अब्दुल कलाम"
  },
  {
    quote: "समय और समझदारी दोनों एक साथ खुशकिस्मत लोगों को ही मिलते हैं।",
    author: "प्रेमचंद"
  },
  {
    quote: "स्वयं को बदलो, संसार अपने आप बदल जाएगा।",
    author: "स्वामी विवेकानंद"
  },
  {
    quote: "जीवन एक दर्पण की तरह है, यह तभी मुस्कुराएगा जब आप मुस्कुराएंगे।",
    author: "अज्ञात"
  },
  {
    quote: "जिसके पास संतोष का धन है, वह दुनिया का सबसे धनी व्यक्ति है।",
    author: "चाणक्य"
  },
  {
    quote: "ज्ञान शक्ति है, लेकिन चरित्र उससे भी बड़ी शक्ति है।",
    author: "महात्मा गांधी"
  },
  {
    quote: "अंधेरे को अंधेरा नहीं मिटा सकता, केवल प्रकाश ही ऐसा कर सकता है।",
    author: "मार्टिन लूथर किंग"
  },
  {
    quote: "आपका सबसे अच्छा शिक्षक आपकी पिछली गलती है।",
    author: "डॉ. एपीजे अब्दुल कलाम"
  },
  {
    quote: "सदा सकारात्मक सोचें, क्योंकि विचार ही शब्द बनते हैं और शब्द ही कर्म।",
    author: "लाओ त्ज़ु"
  },
  {
    quote: "मंजिलें उन्हीं को मिलती हैं, जिनके सपनों में जान होती है; पंखों से कुछ नहीं होता, हौसलों से उड़ान होती है।",
    author: "अज्ञात"
  },
  {
    quote: "जो झुकना जानते हैं, वो सारी दुनिया को झुकाने की ताकत रखते हैं।",
    author: "चाणक्य"
  },
  {
    quote: "सच्चा मित्र वही है जो तब साथ दे जब सारी दुनिया आपका साथ छोड़ दे।",
    author: "प्रेमचंद"
  },
  {
    quote: "शांति की शुरुआत एक मुस्कान के साथ होती है।",
    author: "मदर टेरेसा"
  },
  {
    quote: "ईश्वर उन्हीं की मदद करता है जो अपनी मदद स्वयं करते हैं।",
    author: "स्वामी विवेकानंद"
  }
];

/**
 * Deterministically returns strictly ONE quote for today's date (Asia/Kolkata timezone).
 * Guaranteed to stay constant for the entire 24-hour day across all page refreshes.
 */
export const getTodayQuote = () => {
  try {
    const now = new Date();
    // Get YYYY-MM-DD in Indian Standard Time (IST)
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
    }
    const index = hash % quotes.length;
    return { ...quotes[index], dateStr };
  } catch {
    return { ...quotes[0], dateStr: "आज" };
  }
};

const DailyQuote = ({ variant = "banner" }) => {
  const [copied, setCopied] = useState(false);
  const today = getTodayQuote();

  const handleCopy = () => {
    const shareText = `"${today.quote}" — ${today.author}\n(आज का विचार - Indiianews.in)`;
    navigator.clipboard?.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const shareText = encodeURIComponent(`✨ *आज का विचार* ✨\n\n"${today.quote}"\n\n— *${today.author}*\n\nपढ़ें देश-दुनिया की ताज़ा ख़बरें: https://indiianews.in`);
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, "_blank");
  };

  // Compact inline variant (e.g. inside SearchModal or small spaces)
  if (variant === "compact") {
    return (
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            <Sparkles size={12} className="text-amber-500" />
            आज का विचार (Quote for Today)
          </span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            title="Copy Quote"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>
        <p className="text-gray-800 dark:text-gray-200 font-medium italic text-sm leading-relaxed">
          &ldquo;{today.quote}&rdquo;
        </p>
        <p className="text-right text-[11px] font-bold text-amber-800 dark:text-amber-300">
          — {today.author}
        </p>
      </div>
    );
  }

  // Standard elegant banner variant placed after the search bar
  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 dark:from-amber-950/25 dark:via-orange-950/15 dark:to-amber-950/25 border-b border-amber-200/60 dark:border-amber-900/30 text-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
          {/* Badge */}
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-xs">
            <Sparkles size={11} className="animate-pulse" />
            आज का विचार
          </span>

          {/* Quote text */}
          <p className="text-gray-800 dark:text-gray-200 font-medium text-xs sm:text-sm truncate">
            &ldquo;{today.quote}&rdquo;
            <span className="ml-2 font-bold text-amber-700 dark:text-amber-400 text-xs shrink-0">
              — {today.author}
            </span>
          </p>
        </div>

        {/* Action icons (Copy & Share) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 px-2 py-1 rounded-md hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition cursor-pointer"
            title="कॉपी करें (Copy)"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? "कॉपी हो गया" : "कॉपी"}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
            title="WhatsApp पर शेयर करें"
          >
            <Share2 size={12} />
            <span>शेयर</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuote;
