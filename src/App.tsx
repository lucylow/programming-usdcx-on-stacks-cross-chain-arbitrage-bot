import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { StacksProvider } from "@/lib/stacks/StacksProvider";
import { DappProvider } from "@/lib/dapp/DappProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Bot from "./pages/Bot";
import BotDashboard from "./pages/BotDashboard";
import BotOpportunities from "./pages/BotOpportunities";
import BotHistory from "./pages/BotHistory";
import Analytics from "./pages/Analytics";
import AnalyticsRisk from "./pages/AnalyticsRisk";
import Docs from "./pages/Docs";
import FAQ from "./pages/FAQ";
import Resources from "./pages/Resources";

const queryClient = new QueryClient();

// Route transition wrapper
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/bot" element={<Bot />} />
          <Route path="/bot/dashboard" element={<BotDashboard />} />
          <Route path="/bot/opportunities" element={<BotOpportunities />} />
          <Route path="/bot/history" element={<BotHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics/risk" element={<AnalyticsRisk />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StacksProvider network="testnet">
        <DappProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </DappProvider>
      </StacksProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
