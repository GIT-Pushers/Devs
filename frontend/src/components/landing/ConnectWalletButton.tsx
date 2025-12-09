"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

interface ConnectWalletButtonProps {
  size?: "sm" | "lg";
}

export function ConnectWalletButton({ size = "lg" }: ConnectWalletButtonProps) {
  const isSmall = size === "sm";
  
  return (
    <motion.button
      className={`group relative bg-white text-black font-semibold rounded-lg overflow-hidden ${
        isSmall 
          ? "px-4 py-2 text-sm" 
          : "px-8 py-4 text-base sm:text-lg"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white via-white to-gray-100"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: "-100%", skewX: -20 }}
        whileHover={{ x: "200%", skewX: -20 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Content */}
      <div className={`relative z-10 flex items-center ${isSmall ? "gap-2" : "gap-3"}`}>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        >
          <Wallet className={isSmall ? "h-4 w-4" : "h-5 w-5"} />
        </motion.div>
        <span>Connect Wallet</span>
      </div>
      
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 blur-xl"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

