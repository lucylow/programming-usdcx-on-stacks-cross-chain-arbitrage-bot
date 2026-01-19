import { motion } from "framer-motion";
import { Code2, Shield, LineChart, Palette } from "lucide-react";

const team = [
  {
    icon: Code2,
    name: "Alex Chen",
    role: "Lead Developer",
    bio: "Smart contract expert with 5+ years in DeFi development.",
  },
  {
    icon: Shield,
    name: "Maria Rodriguez",
    role: "Security Architect",
    bio: "Former security auditor at leading blockchain security firm.",
  },
  {
    icon: LineChart,
    name: "James Wilson",
    role: "Quantitative Analyst",
    bio: "Algorithmic trading specialist with Wall Street background.",
  },
  {
    icon: Palette,
    name: "Sarah Johnson",
    role: "UI/UX Designer",
    bio: "Creates intuitive interfaces for complex financial systems.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function TeamSection() {
  return (
    <section id="team" className="py-24 bg-card/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Team</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built by passionate developers and DeFi enthusiasts for the Stacks USDCx Hackathon.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {team.map((member) => (
            <motion.div
              key={member.name}
              variants={cardVariants}
              className="glass-card p-6 text-center hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-5">
                <member.icon className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <div className="text-secondary font-medium text-sm mb-3">{member.role}</div>
              <p className="text-muted-foreground text-sm">{member.bio}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
