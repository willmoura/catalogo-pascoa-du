import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import Home from "@/pages/Home";
import MediaManager from "@/pages/admin/MediaManager";
import BulkImageMigration from "@/pages/admin/BulkImageMigration";

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAnalytics } from "@/hooks/useAnalytics";

import AdminOrders from "@/pages/admin/Orders";

function Router() {
  const [location] = useLocation();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent("page_view", {
      page_path: location,
    });
  }, [location]);

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin/pedidos"} component={AdminOrders} />
      <Route path={"/admin/media"} component={MediaManager} />
      <Route path={"/admin/migration"} component={BulkImageMigration} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <Toaster position="top-center" richColors />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
