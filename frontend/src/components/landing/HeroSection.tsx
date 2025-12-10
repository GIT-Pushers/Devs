"use client";

import { motion } from "framer-motion";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { BackgroundLights } from "./BackgroundLights";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-transparent pt-24 pb-20">
      <BackgroundLights />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="lg:col-span-7 space-y-8 text-center lg:text-left"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur"
              variants={itemVariants}
            >
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Live. On-chain. Verifiable.
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                New 2025
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.35,
                duration: 0.8,
                type: "spring",
                stiffness: 100,
              }}
            >
              Build. Compete. Win. On-Chain.
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.8 }}
            >
              The fastest way to launch trustless hackathons with transparent
              prize pools, AI-backed judging, and verifiable submissions. Built
              for teams, sponsors, and judges to move in sync.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75, duration: 0.5, type: "spring" }}
            >
              <Link href="/home">
                <Button
                  variant="default"
                  size="lg"
                  className="text-base font-semibold bg-linear-to-r from-primary via-info to-warning text-background shadow-md hover:shadow-lg"
                >
                  Explore Hackathons
                </Button>
              </Link>
              <div className="w-full sm:w-auto">
                <ConnectWalletButton />
              </div>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start"
              variants={itemVariants}
            >
              {[
                "Fully on-chain",
                "Gasless submissions",
                "AI + Judges",
                "Automatic rewards",
              ].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-border/70 bg-secondary/40 px-3 py-2 text-xs font-semibold text-foreground/80 backdrop-blur"
                >
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              {[
                { label: "Prize volume", value: "$1.2M+" },
                { label: "Teams formed", value: "4.2k" },
                { label: "Avg. payout", value: "< 60s" },
                { label: "Uptime", value: "99.9%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/70 bg-secondary/50 px-4 py-3 text-left shadow-sm"
                >
                  <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    {stat.label}
                  </div>
                  <div className="text-xl font-semibold text-foreground">
                    {stat.value}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="lg:col-span-5"
            variants={itemVariants}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-secondary/50 p-6 shadow-lg backdrop-blur">
              <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-warning/10 blur-3xl" />
              <div className="relative space-y-4">
                <p className="text-sm text-muted-foreground">
                  Workflow snapshot
                </p>
                <div className="space-y-3">
                  {[
                    "Sponsors lock prize pools on-chain",
                    "Teams stake to commit and submit GitHub repos",
                    "AI + judges score with transparent proofs",
                    "Prizes distribute automatically to winners",
                  ].map((line, idx) => (
                    <div
                      key={line}
                      className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-foreground/90">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
