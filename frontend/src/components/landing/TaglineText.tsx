"use client";

import { motion } from "framer-motion";

export function TaglineText() {
  const text = "The Future of Decentralized Hackathons";
  const letters = Array.from(text);

  return (
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.03,
            duration: 0.5,
            ease: "easeOut",
          }}
          className="inline-block text-foreground bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </h1>
  );
}

