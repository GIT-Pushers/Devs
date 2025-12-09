"use client";

import { motion } from "framer-motion";

export function SubheadlineText() {
  return (
    <motion.div 
      className="space-y-4 max-w-3xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      <p className="text-base sm:text-lg md:text-xl text-foreground/90 font-medium leading-relaxed">
        A fully decentralized hackathon platform where everything — from sponsorships, team registrations, project submissions, judging, voting, to prize distribution — happens on-chain, with AI-powered repo analysis and GitHub verification handled off-chain.
      </p>
      <motion.p 
        className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        Experience the future of decentralized hackathons.
      </motion.p>
    </motion.div>
  )
}

