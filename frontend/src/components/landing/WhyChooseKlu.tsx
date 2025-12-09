"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  {
    title: "Fully Decentralized",
    description:
      "Everything on-chain. No central authority. Complete transparency.",
  },
  {
    title: "AI-Powered Analysis",
    description:
      "Instant code evaluation with AI, judges, and community voting.",
  },
  {
    title: "Automatic Prizes",
    description:
      "Instant prize distribution via smart contracts. No intermediaries.",
  },
  {
    title: "GitHub Integration",
    description: "Submit GitHub projects with off-chain verification.",
  },
];

export function WhyChooseHackX() {
  return (
    <section id="why-hackx" className="py-24 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
            Why Choose HACKX
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Decentralized. Transparent. Automated.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.15,
                duration: 0.5,
                type: "spring",
              }}
              whileHover={{
                y: -5,
                scale: 1.02,
                transition: { duration: 0.3 },
              }}
            >
              <Card className="bg-background border border-border hover:border-foreground/30 transition-colors">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            type: "spring",
          }}
          className="max-w-4xl mx-auto"
        >
          <Card className="border-2 border-border bg-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">
                  Hackathon Workflow
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  Live on-chain
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">
                    Web3 Innovation Hackathon
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-muted-foreground">
                        Active - 3 days remaining
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        127 teams • 50 ETH prize pool • 89 submissions
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/20 text-foreground rounded-full text-xs border border-border">
                      Active
                    </span>
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs border border-border">
                      12 sponsors
                    </span>
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs border border-border">
                      127 teams
                    </span>
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs border border-border">
                      89 projects
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
