import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SkipToContent } from "./components/ui/accessibility";
import { StacksProvider } from "../lib/stacks/StacksProvider";
import { DappProvider } from "../lib/dapp/DappProvider";
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
import InteractiveDemoPage from "./pages/InteractiveDemo";
import GovernancePage from "./pages/Governance";
import PortfolioPage from "./pages/Portfolio";
import SwapPage from "./pages/Swap";
import MarketsPage from "./pages/Markets";
import ActivityPage from "./pages/Activity";
import SettingsPage from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

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
          <Route path="/demo" element={<InteractiveDemoPage />} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
      <StacksProvider>
        <DappProvider>
          <SkipToContent />
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
