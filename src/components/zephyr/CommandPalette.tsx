import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Command, ArrowRight, Shield, Bitcoin, Activity, 
  Settings, HelpCircle, FileText, Zap, Users, X 
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { id: "deposit", title: "Make Deposit", description: "Start a private deposit", icon: Zap, action: () => {}, category: "Actions" },
    { id: "withdraw", title: "Withdraw Funds", description: "Generate ZK proof and withdraw", icon: Shield, action: () => {}, category: "Actions" },
    { id: "dashboard", title: "View Dashboard", description: "Check your privacy metrics", icon: Activity, action: () => {}, category: "Navigation" },
    { id: "transactions", title: "Transaction History", description: "View all your transactions", icon: FileText, action: () => {}, category: "Navigation" },
    { id: "privacy", title: "Privacy Score", description: "Check your anonymity level", icon: Users, action: () => {}, category: "Navigation" },
    { id: "settings", title: "Settings", description: "Manage your preferences", icon: Settings, action: () => {}, category: "Navigation" },
    { id: "docs", title: "Documentation", description: "Read the technical docs", icon: FileText, action: () => {}, category: "Help" },
    { id: "support", title: "Get Support", description: "Contact our team", icon: HelpCircle, action: () => {}, category: "Help" },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      filteredCommands[selectedIndex].action();
      onClose();
    }
  }, [filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-lg"
              autoFocus
            />
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground">ESC</kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No commands found for "{query}"
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map((cmd) => {
                    const currentIndex = globalIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-primary/20" : "bg-muted"
                        }`}>
                          <cmd.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{cmd.title}</div>
                          <div className="text-sm text-muted-foreground">{cmd.description}</div>
                        </div>
                        {isSelected && <ArrowRight className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted rounded">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />K to toggle
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen, toggle: () => setIsOpen((prev) => !prev) };
}
