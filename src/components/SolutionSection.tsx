import { motion } from "framer-motion";
import { Brain, Calculator, Shield, Layers, Cable } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SolutionSection() {
  return (
    <section id="solution" className="py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Automated Solution
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A sophisticated arbitrage bot that automatically detects and executes profitable cross-chain trades.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Ethereum Layer */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5 border-l-4 border-l-ethereum flex items-center gap-4 w-full max-w-xs"
            >
              <div className="w-10 h-10 rounded-lg bg-ethereum/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-ethereum" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold">Ethereum</h4>
                <p className="text-sm text-muted-foreground">Uniswap V3, Curve</p>
              </div>
            </motion.div>

            {/* Connector */}
            <div className="w-0.5 h-8 bg-border" />

            {/* Bot Core */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {[
                { icon: Brain, title: "Price Oracle", desc: "Real-time price feeds" },
                { icon: Calculator, title: "Arbitrage Engine", desc: "Opportunity detection" },
                { icon: Shield, title: "Risk Manager", desc: "Circuit breakers" },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="glass-card p-5 hover:border-primary/50 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Connector */}
            <div className="w-0.5 h-8 bg-border" />

            {/* Bridge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="glass-card p-5 border-l-4 border-l-secondary flex items-center gap-4 w-full max-w-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Cable className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-semibold">Circle xReserve</h4>
                <p className="text-sm text-muted-foreground">Programmatic bridge</p>
              </div>
            </motion.div>

            {/* Connector */}
            <div className="w-0.5 h-8 bg-border" />

            {/* Stacks Layer */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="glass-card p-5 border-l-4 border-l-stacks flex items-center gap-4 w-full max-w-xs"
            >
              <div className="w-10 h-10 rounded-lg bg-stacks/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-stacks" />
              </div>
              <div>
                <h4 className="font-semibold">Stacks</h4>
                <p className="text-sm text-muted-foreground">ALEX, Arkadiko</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1 }}
            className="text-center mt-12"
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
            >
              <a href="#demo">See It In Action</a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
