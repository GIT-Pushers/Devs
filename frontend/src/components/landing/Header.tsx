"use client";

import { AnimatePresence, motion } from "framer-motion";
import WalletConnectionButton from "@/components/WalletConnectionButton";
import AuthButton from "@/components/AuthButton";
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/my-teams", label: "My Teams" },
    { href: "/Createhack", label: "Create Hackathon" },
    { href: "/#features", label: "Features" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/70 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Link
            href="/"
            className="text-2xl font-bold bg-linear-to-r from-primary to-warning bg-clip-text text-transparent"
            onClick={(e) => {
              e.preventDefault();
              router.push("/");
            }}
          >
            HACKX
          </Link>
          <span className="inline-flex items-center rounded-full border border-border/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            On-Chain Hackathons
          </span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "text-foreground"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              <span className="relative z-10">{item.label}</span>
              <span
                className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-primary/15 shadow-sm"
                    : "hover:bg-accent"
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* Desktop Right Section */}
        <motion.div
          className="hidden md:flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <WalletConnectionButton />
          <AuthButton />
        </motion.div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors border border-border/60"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-border/70 bg-background shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="container py-4 px-4 space-y-2">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-primary/15 text-foreground"
                      : "text-foreground/75 hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 space-y-3 border-t border-border/70">
                <WalletConnectionButton />
                <AuthButton />
                <div className="flex justify-between items-center px-4">
                  <span className="text-sm text-muted-foreground">Theme</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
