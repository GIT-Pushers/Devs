"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4 text-foreground">HACKX</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fully Decentralized Hackathon Platform.
            </p>
            <p className="text-sm text-muted-foreground">
              Build. Compete. Win. On-Chain.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#why-hackx"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Why HACKX
                </Link>
              </li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#docs"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#security"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="#privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="mt-6 flex gap-4">
              <Link
                href="#twitter"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Twitter
              </Link>
              <Link
                href="#github"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </Link>
              <Link
                href="#discord"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Discord
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 HACKX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
