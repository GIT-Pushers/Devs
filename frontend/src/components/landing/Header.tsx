"use client";

import { motion } from "framer-motion";
import WalletConnectionButton from "@/components/WalletConnectionButton";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";

export function Header() {
  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Link href="/" className="text-2xl font-bold text-foreground">
            HACKX
          </Link>
        </motion.div>
        <nav className="hidden md:flex items-center gap-6">
          {["Features", "How It Works", "Why HACKX"].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <Link
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors relative group"
              >
                {item}
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-foreground group-hover:w-full transition-all duration-300"
                  initial={false}
                />
              </Link>
            </motion.div>
          ))}
        </nav>
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <WalletConnectionButton />
          <div className="hidden sm:block">
            <AuthButton />
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
