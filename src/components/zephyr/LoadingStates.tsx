import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded mb-2" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    </div>
  );
}

export function SkeletonTransaction() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div>
          <div className="h-4 w-20 bg-muted rounded mb-2" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 w-24 bg-muted rounded mb-2" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card p-6 text-center animate-pulse">
          <div className="w-6 h-6 rounded bg-muted mx-auto mb-3" />
          <div className="h-8 w-16 bg-muted rounded mx-auto mb-2" />
          <div className="h-3 w-20 bg-muted rounded mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-primary/30 border-t-primary rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Loading...</p>
      </motion.div>
    </div>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-secondary"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}
