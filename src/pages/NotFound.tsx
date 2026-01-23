import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">404</h1>
        <p className="mb-2 text-2xl font-semibold">Oops! Page not found</p>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              Return to Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/bot/dashboard" className="text-sm text-primary hover:underline">Bot Dashboard</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/analytics" className="text-sm text-primary hover:underline">Analytics</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/docs" className="text-sm text-primary hover:underline">Documentation</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/faq" className="text-sm text-primary hover:underline">FAQ</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
