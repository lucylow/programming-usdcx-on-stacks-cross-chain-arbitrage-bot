import { useState } from "react";
import { motion } from "framer-motion";

interface ToggleSettingProps {
  title: string;
  description: string;
  defaultEnabled?: boolean;
  onChange?: (enabled: boolean) => void;
}

export function ToggleSetting({ 
  title, 
  description, 
  defaultEnabled = true,
  onChange 
}: ToggleSettingProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
      <div className="flex-1 pr-4">
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: enabled ? "calc(100% - 20px)" : "4px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
