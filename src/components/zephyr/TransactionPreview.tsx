import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Shield, Clock, ExternalLink } from "lucide-react";

interface Transaction {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  status: "completed" | "mixing" | "pending";
  privacyLevel: "standard" | "high" | "maximum";
  timestamp: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: 0.5,
    status: "completed",
    privacyLevel: "high",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "withdraw",
    amount: 0.3,
    status: "mixing",
    privacyLevel: "maximum",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    type: "deposit",
    amount: 1.2,
    status: "completed",
    privacyLevel: "standard",
    timestamp: "1 day ago",
  },
  {
    id: "4",
    type: "withdraw",
    amount: 0.8,
    status: "completed",
    privacyLevel: "high",
    timestamp: "2 days ago",
  },
];

export function TransactionPreview() {
  return (
    <div className="space-y-3">
      {mockTransactions.map((tx, index) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="group flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border hover:border-primary/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === "deposit"
                  ? "bg-secondary/10 text-secondary"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {tx.type === "deposit" ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold capitalize">{tx.type}</span>
                <StatusBadge status={tx.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{tx.timestamp}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Privacy Level */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-xs">
              <Shield className="w-3 h-3 text-primary" />
              <span className="capitalize text-primary">{tx.privacyLevel}</span>
            </div>

            {/* Amount */}
            <div className="text-right">
              <div className="font-mono font-bold">
                {tx.type === "deposit" ? "+" : "-"}{tx.amount} BTC
              </div>
            </div>

            {/* External link */}
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: "bg-secondary/10 text-secondary border-secondary/20",
    mixing: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
        styles[status as keyof typeof styles]
      }`}
    >
      {status === "mixing" && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
