"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Create Hackathons",
    description: "Launch hackathons with on-chain transparency.",
    features: [
      "Custom rules & deadlines",
      "Prize pool management",
      "On-chain tracking",
    ],
  },
  {
    title: "Sponsor Prize Pools",
    description: "Lock funds in smart contracts.",
    features: ["Secure contributions", "Automatic distribution"],
  },
  {
    title: "Form Teams",
    description: "Team up and register on-chain.",
    features: ["On-chain registration", "Shared submissions"],
  },
  {
    title: "Stake to Participate",
    description: "Stake tokens to enter hackathons.",
    features: ["Commitment mechanism", "Refundable stakes"],
  },
  {
    title: "AI-Powered Analysis",
    description: "Instant code quality evaluation.",
    features: ["Automated analysis", "GitHub verification"],
  },
  {
    title: "Multi-Layer Judging",
    description: "AI + judges + community voting.",
    features: ["Fair evaluation", "Transparent scoring"],
  },
  {
    title: "Automatic Prizes",
    description: "Instant prize distribution via smart contracts.",
    features: ["No intermediaries", "Trustless execution"],
  },
  {
    title: "On-Chain Everything",
    description: "Complete transparency and immutability.",
    features: ["Public records", "No central authority"],
  },
];

export function TeamTypes() {
  return (
    <section id="features" className="relative py-24 bg-transparent">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(122,240,255,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(247,201,72,0.06),transparent_32%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
            Platform Features
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Everything for decentralized hackathons
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                type: "spring",
              }}
              whileHover={{
                y: -5,
                scale: 1.02,
                transition: { duration: 0.3 },
              }}
            >
              <Card className="h-full border border-border/70 bg-secondary/50 hover:border-primary/50 transition-all duration-300 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs flex items-start gap-2 text-muted-foreground"
                      >
                        <span className="text-foreground mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
