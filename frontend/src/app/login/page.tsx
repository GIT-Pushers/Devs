"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SignInButton from "@/components/SignInButton";
import WalletConnectionButton from "@/components/WalletConnectionButton";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary-foreground">
                HX
              </span>
            </div>
            <CardTitle className="text-3xl font-bold">
              Welcome to HackX
            </CardTitle>
            <CardDescription className="text-base">
              Connect your wallet or sign in with GitHub to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Wallet Connection Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Connect Wallet
              </h3>
              <div className="flex justify-center">
                <WalletConnectionButton />
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* GitHub Login Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Social Login
              </h3>
              <SignInButton />
            </div>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground pt-4">
              By connecting, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            New to HackX?{" "}
            <a href="/" className="text-primary font-semibold hover:underline">
              Learn more
            </a>
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
