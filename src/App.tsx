import { lazy, Suspense } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SkipToContent } from "./components/ui/accessibility";
import { StacksProvider } from "@lib/stacks/StacksProvider";
import { DappProvider } from "@lib/dapp/DappProvider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Layout } from "./components/layout/Layout";
import { Skeleton } from "./components/ui/skeleton";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Bot = lazy(() => import("./pages/Bot"));
const BotDashboard = lazy(() => import("./pages/BotDashboard"));
const BotOpportunities = lazy(() => import("./pages/BotOpportunities"));
const BotHistory = lazy(() => import("./pages/BotHistory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AnalyticsRisk = lazy(() => import("./pages/AnalyticsRisk"));
const Docs = lazy(() => import("./pages/Docs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Resources = lazy(() => import("./pages/Resources"));
const InteractiveDemoPage = lazy(() => import("./pages/InteractiveDemo"));
const GovernancePage = lazy(() => import("./pages/Governance"));
const PortfolioPage = lazy(() => import("./pages/Portfolio"));
const SwapPage = lazy(() => import("./pages/Swap"));
const MarketsPage = lazy(() => import("./pages/Markets"));
const ActivityPage = lazy(() => import("./pages/Activity"));
const SettingsPage = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Loading fallback component
const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-8" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StacksProvider>
        <DappProvider>
          <SkipToContent />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Layout showBreadcrumbs={false} showNavigation={false}>
                        <Index />
                      </Layout>
                    }
                  />
                  <Route
                    path="/bot"
                    element={
                      <Layout>
                        <Bot />
                      </Layout>
                    }
                  />
                  <Route
                    path="/bot/dashboard"
                    element={
                      <Layout>
                        <BotDashboard />
                      </Layout>
                    }
                  />
                  <Route
                    path="/bot/opportunities"
                    element={
                      <Layout>
                        <BotOpportunities />
                      </Layout>
                    }
                  />
                  <Route
                    path="/bot/history"
                    element={
                      <Layout>
                        <BotHistory />
                      </Layout>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <Layout>
                        <Analytics />
                      </Layout>
                    }
                  />
                  <Route
                    path="/analytics/risk"
                    element={
                      <Layout>
                        <AnalyticsRisk />
                      </Layout>
                    }
                  />
                  <Route
                    path="/demo"
                    element={
                      <Layout>
                        <InteractiveDemoPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/governance"
                    element={
                      <Layout>
                        <GovernancePage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/portfolio"
                    element={
                      <Layout>
                        <PortfolioPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/swap"
                    element={
                      <Layout>
                        <SwapPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/markets"
                    element={
                      <Layout>
                        <MarketsPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/activity"
                    element={
                      <Layout>
                        <ActivityPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/docs"
                    element={
                      <Layout>
                        <Docs />
                      </Layout>
                    }
                  />
                  <Route
                    path="/faq"
                    element={
                      <Layout>
                        <FAQ />
                      </Layout>
                    }
                  />
                  <Route
                    path="/resources"
                    element={
                      <Layout>
                        <Resources />
                      </Layout>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <Layout>
                        <NotFound />
                      </Layout>
                    }
                  />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </DappProvider>
      </StacksProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
