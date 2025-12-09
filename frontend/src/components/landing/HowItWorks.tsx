"use client";

import { motion } from "framer-motion";

const steps = [
  {
    title: "Create & Sponsor",
    description: "Launch hackathons or sponsor prize pools on-chain.",
  },
  {
    title: "Form Teams & Stake",
    description: "Form teams and stake tokens to participate.",
  },
  {
    title: "Submit & Verify",
    description: "Submit GitHub projects for AI-powered analysis.",
  },
  {
    title: "Judge & Win",
    description: "Get judged by AI, judges, and community. Win prizes automatically.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-black relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">How HACKX Works</h2>
          <p className="text-base text-gray-300 max-w-xl mx-auto">
            Everything on-chain. Transparent. Automated.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: index * 0.15,
                duration: 0.6,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -10, 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              className="flex flex-col items-center text-center cursor-pointer"
            >
              <motion.div 
                className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/20"
                whileHover={{ 
                  rotate: 360,
                  scale: 1.1,
                  backgroundColor: "rgba(255,255,255,0.2)"
                }}
                transition={{ duration: 0.5 }}
              >
                <motion.span 
                  className="text-2xl font-bold text-white"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.2, type: "spring" }}
                >
                  {index + 1}
                </motion.span>
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-white">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

