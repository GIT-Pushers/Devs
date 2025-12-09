"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4 text-white">HACKX</h3>
            <p className="text-sm text-gray-400 mb-4">
              Fully Decentralized Hackathon Platform.
            </p>
            <p className="text-sm text-gray-400">
              Build. Compete. Win. On-Chain.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold mb-4 text-white">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#why-hackx" className="text-gray-400 hover:text-white transition-colors">
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
            <h4 className="font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#docs" className="text-gray-400 hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#security" className="text-gray-400 hover:text-white transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="mt-6 flex gap-4">
              <Link href="#twitter" className="text-gray-400 hover:text-white transition-colors">
                Twitter
              </Link>
              <Link href="#github" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </Link>
              <Link href="#discord" className="text-gray-400 hover:text-white transition-colors">
                Discord
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-400">
          <p>© 2025 HACKX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

