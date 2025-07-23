import { useState } from "react";
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

  const handleTypeClick = async (type, mood) => {
    setLoading(true);
    setError("");
    setSelectedMood(mood);
    setSelectedType(type);

    try {
      // Simulate API call - replace with your actual fetch call
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/image/type?type=${type}`
      );
      const data = await response.json();

      if (response.ok) {
        const newImage = {
          url: data.imageUrl,
          type,
          mood,
          timestamp: Date.now(),
        };
        setImageUrl(data.imageUrl);
        setImageHistory((prev) => [newImage, ...prev.slice(0, 4)]); // Keep last 5 images
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (err) {
      console.log("error: ", err);
      setError("Failed to fetch image. Please try again.");
    } finally {
      setLoading(false);
    }
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

        <motion.button
          onClick={toggleMode}
          className={`mt-3 px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-bold ${
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
                className="relative w-full h-64 md:h-full flex items-center justify-center"
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.img
                  src={imageUrl}
                  alt="Mood image"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                  onError={() => setError("Failed to load image")}
                />

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
