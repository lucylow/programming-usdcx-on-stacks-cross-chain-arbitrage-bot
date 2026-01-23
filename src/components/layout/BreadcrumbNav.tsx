import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Route label mapping
const routeLabels: Record<string, string> = {
  "/": "Home",
  "/bot": "Bot",
  "/bot/dashboard": "Dashboard",
  "/bot/opportunities": "Opportunities",
  "/bot/history": "History",
  "/analytics": "Analytics",
  "/analytics/risk": "Risk Analysis",
  "/portfolio": "Portfolio",
  "/swap": "Swap",
  "/markets": "Markets",
  "/activity": "Activity",
  "/settings": "Settings",
  "/governance": "Governance",
  "/demo": "Interactive Demo",
  "/docs": "Documentation",
  "/faq": "FAQ",
  "/resources": "Resources",
};

export function BreadcrumbNav() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumbs on home page
  if (location.pathname === "/") {
    return null;
  }

  const breadcrumbs = [
    {
      label: "Home",
      path: "/",
      icon: Home,
    },
    ...pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join("/")}`;
      const label = routeLabels[to] || value.charAt(0).toUpperCase() + value.slice(1);
      return {
        label,
        path: to,
        isLast: index === pathnames.length - 1,
      };
    }),
  ];

  return (
    <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="flex items-center gap-1.5">
                      {index === 0 && <crumb.icon className="w-4 h-4" />}
                      <span className="font-medium">{crumb.label}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        to={crumb.path}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        {index === 0 && <crumb.icon className="w-4 h-4" />}
                        <span>{crumb.label}</span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </BreadcrumbSeparator>
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
