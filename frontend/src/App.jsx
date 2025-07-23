import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const moodTypeMap = {
  happy: {
    safe: ["neko", "coffee", "food", "holo"],
    adult: ["boobs", "pussy", "paizuri"],
    emoji: "😊",
    color: "from-yellow-400 to-orange-500",
  },
  curious: {
    safe: ["kemonomimi", "neko", "holo"],
    adult: ["hentai", "tentacle", "anal"],
    emoji: "🤔",
    color: "from-purple-400 to-blue-500",
  },
  lonely: {
    safe: ["holo", "neko"],
    adult: ["ass", "thigh", "pussy"],
    emoji: "😔",
    color: "from-blue-400 to-indigo-500",
  },
  naughty: {
    safe: ["neko", "kemonomimi"],
    adult: ["hentai", "boobs", "pussy", "paizuri"],
    emoji: "😈",
    color: "from-red-400 to-pink-500",
  },
};

function App() {
  const [mode, setMode] = useState("safe");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState("");
  const [imageHistory, setImageHistory] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [userStats, setUserStats] = useState(null);
  
  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: "",
    senderName: "",
    message: ""
  });
  const [emailLoading, setEmailLoading] = useState(false);

  // Generate session ID on component mount
  useEffect(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setSessionId(newSessionId);
    fetchUserStats(newSessionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:6000";

  const fetchUserStats = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/user/stats`, {
        headers: { 'X-Session-ID': sessionId }
      });
      const data = await response.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (err) {
      console.log("Stats fetch error:", err);
    }
  };

  const handleTypeClick = async (type, mood) => {
    setLoading(true);
    setError("");
    setSelectedMood(mood);
    setSelectedType(type);

    try {
      const response = await fetch(
        `${API_URL}/api/image/type?type=${type}&mood=${mood}&mode=${mode}`,
        {
          headers: { 'X-Session-ID': sessionId }
        }
      );
      const data = await response.json();

      if (response.ok) {
        const newImage = {
          url: data.imageUrl,
          type,
          mood,
          timestamp: Date.now()
        };
        setImageUrl(data.imageUrl);
        setImageHistory((prev) => [newImage, ...prev.slice(0, 4)]);
        
        // Refresh stats
        fetchUserStats(sessionId);
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      console.log("error: ", err);
      setError("Failed to fetch image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(`${API_URL}/api/image/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          imageUrl,
          type: selectedType,
          mood: selectedMood
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = data.imageUrl;
        link.download = data.filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        fetchUserStats(sessionId);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download image");
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailForm.recipientEmail || !imageUrl) return;
    
    setEmailLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/image/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          imageUrl,
          recipientEmail: emailForm.recipientEmail,
          senderName: emailForm.senderName,
          message: emailForm.message,
          type: selectedType,
          mood: selectedMood
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Email sent successfully! 📧");
        setShowEmailModal(false);
        setEmailForm({ recipientEmail: "", senderName: "", message: "" });
        fetchUserStats(sessionId);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Email error:", err);
      alert("Failed to send email: " + err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const shareToSocial = (platform) => {
    if (!imageUrl) return;
    
    const text = `Check out this ${selectedMood} ${selectedType} image I found!`;
    const url = encodeURIComponent(imageUrl);
    const shareText = encodeURIComponent(text);
    
    let shareUrl = '';
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${shareText} ${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${shareText}`;
        break;
    }
    
    window.open(shareUrl, '_blank');
    setShowShareModal(false);
  };

  const copyImageUrl = () => {
    if (!imageUrl) return;
    
    navigator.clipboard.writeText(imageUrl).then(() => {
      alert("Image URL copied to clipboard! 📋");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = imageUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("Image URL copied to clipboard! 📋");
    });
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "safe" ? "adult" : "safe"));
    setImageUrl("");
    setError("");
    setSelectedMood(null);
    setSelectedType(null);
  };

  const selectFromHistory = (historyItem) => {
    setImageUrl(historyItem.url);
    setSelectedMood(historyItem.mood);
    setSelectedType(historyItem.type);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const imageVariants = {
    hidden: { scale: 0.8, opacity: 0, rotateY: -90 },
    visible: {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: 0.6,
        ease: "backOut",
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      rotateY: 90,
      transition: {
        duration: 0.3,
      },
    },
  };

  const quickPulse = {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 },
  };

  return (
    <motion.div
      className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden flex flex-col"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full"
            animate={{
              x: [0, 50, 0],
              y: [0, -50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        className="relative z-10 text-center py-4 px-4"
        variants={itemVariants}
      >
        <motion.h1
          className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
          whileHover={{ scale: 1.02 }}
        >
          Mood Image Fetcher
        </motion.h1>

        <div className="flex justify-center items-center gap-4 mt-3">
          <motion.button
            onClick={toggleMode}
            className={`px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-bold ${
              mode === "safe"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-rose-500 to-pink-500"
            }`}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mode === "safe" ? "🛡️ Safe" : "🔥 Adult"}
          </motion.button>

          <motion.button
            onClick={() => setShowStatsModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-sm font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 Stats
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 relative z-10 min-h-0">
        {/* Left Panel - Controls */}
        <motion.div
          className="lg:w-1/2 xl:w-2/5 flex flex-col gap-3 overflow-y-auto scrollbar-hide"
          variants={itemVariants}
        >
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap gap-2 mb-2">
            <motion.button
              onClick={() => setImageUrl("")}
              className="px-3 py-1 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear
            </motion.button>
            {imageHistory.length > 0 && (
              <motion.button
                onClick={() => selectFromHistory(imageHistory[0])}
                className="px-3 py-1 bg-blue-500/20 rounded-lg text-xs hover:bg-blue-500/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Last Image
              </motion.button>
            )}
          </div>

          {/* Mood Categories - Compact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(moodTypeMap).map(([mood, data]) => (
              <motion.div
                key={mood}
                className={`relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${
                  data.color
                } shadow-xl border border-white/20 ${
                  selectedMood === mood ? "ring-2 ring-white/50 shadow-2xl" : ""
                }`}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                animate={selectedMood === mood ? quickPulse : {}}
              >
                <div className="text-center mb-3">
                  <motion.div
                    className="text-2xl sm:text-3xl mb-1"
                    animate={{
                      rotate: selectedMood === mood ? [0, -5, 5, 0] : 0,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    {data.emoji}
                  </motion.div>
                  <h3 className="text-sm sm:text-lg font-bold capitalize text-white">
                    {mood}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  {data[mode].map((type, index) => (
                    <motion.button
                      key={`${mood}-${type}-${index}`}
                      onClick={() => handleTypeClick(type, mood)}
                      className={`bg-white/20 hover:bg-white/40 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/30 transition-all duration-200 ${
                        selectedType === type && selectedMood === mood
                          ? "bg-white/50 ring-1 ring-white/70"
                          : ""
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Image History - Horizontal Scroll */}
          {imageHistory.length > 0 && (
            <motion.div
              className="mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.5 }}
            >
              <h4 className="text-sm font-semibold mb-2 text-gray-300">
                Recent Images:
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {imageHistory.map((item, index) => (
                  <motion.button
                    key={item.timestamp}
                    onClick={() => selectFromHistory(item)}
                    className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/50 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <img
                      src={item.url}
                      alt={item.type}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right Panel - Image Display */}
        <motion.div
          className="lg:w-1/2 xl:w-3/5 flex flex-col items-center justify-center p-4 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10"
          variants={itemVariants}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                className="flex flex-col items-center gap-4"
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.div
                  className="w-8 h-8 sm:w-12 sm:h-12 border-3 border-cyan-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.p
                  className="text-sm sm:text-base text-gray-300"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Loading magic...
                </motion.p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-4xl sm:text-6xl mb-4">😞</div>
                <p className="text-red-300 text-sm sm:text-base">{error}</p>
              </motion.div>
            ) : imageUrl ? (
              <motion.div
                key={imageUrl}
                className="relative w-full h-64 md:h-full flex flex-col items-center justify-center"
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.img
                  src={imageUrl}
                  alt="Mood image"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl mb-4"
                  whileHover={{ scale: 1.02 }}
                  onError={() => setError("Failed to load image")}
                />

                {/* Action Buttons */}
                <motion.div
                  className="flex flex-wrap gap-2 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-sm font-bold flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📥 Download
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setShowEmailModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-bold flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📧 Email
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-sm font-bold flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🔗 Share
                  </motion.button>
                  
                  <motion.button
                    onClick={copyImageUrl}
                    className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg text-sm font-bold flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📋 Copy URL
                  </motion.button>
                </motion.div>

                {/* Current Selection Indicator */}
                {selectedMood && (
                  <motion.div
                    className="absolute top-3 left-3 bg-black/70 rounded-xl px-3 py-1 backdrop-blur-md border border-white/20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <span className="text-lg mr-2">
                      {moodTypeMap[selectedMood].emoji}
                    </span>
                    <span className="text-white text-sm font-medium">
                      {selectedType} • {selectedMood}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-4xl sm:text-8xl mb-4 text-white/20"
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, -1, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🖼️
                </motion.div>
                <p className="text-gray-400 text-sm sm:text-lg">
                  Choose a mood to discover images
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-center">📧 Send via Email</h3>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Recipient's email"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-cyan-400 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={emailForm.senderName}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, senderName: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-cyan-400 focus:outline-none"
                />
                <textarea
                  placeholder="Personal message (optional)"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-cyan-400 focus:outline-none h-20 resize-none"
                />
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 py-2 bg-gray-600 rounded-lg font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={emailLoading}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-medium disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {emailLoading ? "Sending..." : "Send Email"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-white/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-center">🔗 Share Image</h3>
              <div className="space-y-3">
                <motion.button
                  onClick={() => shareToSocial('twitter')}
                  className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🐦 Share on Twitter
                </motion.button>
                <motion.button
                  onClick={() => shareToSocial('whatsapp')}
                  className="w-full py-3 bg-gradient-to-r from-green-400 to-green-600 rounded-lg font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💬 Share on WhatsApp
                </motion.button>
                <motion.button
                  onClick={() => shareToSocial('telegram')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-lg font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ✈️ Share on Telegram
                </motion.button>
                <motion.button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-2 bg-gray-600 rounded-lg font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStatsModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-center">📊 Your Stats</h3>
              {userStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">{userStats.totalFetches}</div>
                      <div className="text-sm text-gray-400">Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{userStats.totalDownloads}</div>
                      <div className="text-sm text-gray-400">Downloads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{userStats.totalShares}</div>
                      <div className="text-sm text-gray-400">Shares</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-600 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Favorite Mode:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        userStats.favoriteMode === 'safe' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {userStats.favoriteMode === 'safe' ? '🛡️ Safe' : '🔥 Adult'}
                      </span>
                    </div>
                    
                    {userStats.favoriteMood && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Favorite Mood:</span>
                        <span className="flex items-center gap-1">
                          <span>{moodTypeMap[userStats.favoriteMood]?.emoji}</span>
                          <span className="capitalize text-white">{userStats.favoriteMood}</span>
                        </span>
                      </div>
                    )}
                    
                    {!userStats.isNewUser && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Member Since:</span>
                        <span className="text-white text-sm">
                          {new Date(userStats.memberSince).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">Loading stats...</div>
              )}
              
              <motion.button
                onClick={() => setShowStatsModal(false)}
                className="w-full mt-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  );
}

export default App;