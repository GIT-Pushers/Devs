"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export function BackgroundLights() {
  // Generate particles once with consistent positions to avoid hydration mismatch
  const particles = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: (i * 17.3) % 100, // Deterministic pseudo-random using index
      top: (i * 23.7) % 100,
      duration: 3 + (i % 5) * 0.5,
      delay: (i % 10) * 0.2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
