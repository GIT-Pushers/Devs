"use client";

import Link from "next/link";
import WalletConnectionButton from "@/components/WalletConnectionButton";
import { ModeToggle } from "@/components/ModeToggle";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              HACKX
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/Createhack"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Create Hackathon
            </Link>
          </div>

          {/* Right Section: Wallet + Theme Toggle */}
          <div className="flex items-center gap-3">
            <WalletConnectionButton />
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
