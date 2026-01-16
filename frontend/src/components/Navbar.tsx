"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import WalletConnectionButton from "@/components/WalletConnectionButton";
import { ModeToggle } from "@/components/ModeToggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-50">
            <span className="text-2xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Hackathon Platform
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/home"
              className={`px-4 py-2 rounded-lg transition-all ${
                isActive("/home")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              Home
            </Link>
            <Link
              href="/my-teams"
              className={`px-4 py-2 rounded-lg transition-all ${
                isActive("/my-teams")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              My Teams
            </Link>
            <Link
              href="/Createhack"
              className={`px-4 py-2 rounded-lg transition-all ${
                isActive("/Createhack")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              Create Hackathon
            </Link>
          </div>

          {/* Right Section: Wallet + Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <WalletConnectionButton />
              <ModeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            <Link
              href="/home"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-all ${
                isActive("/home")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              Home
            </Link>
            <Link
              href="/my-teams"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-all ${
                isActive("/my-teams")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              My Teams
            </Link>
            <Link
              href="/Createhack"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg transition-all ${
                isActive("/Createhack")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              }`}
            >
              Create Hackathon
            </Link>
            <div className="pt-3 space-y-3 border-t border-border">
              <WalletConnectionButton />
              <div className="flex justify-between items-center px-4">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ModeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
