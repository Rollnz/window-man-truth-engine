import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";
import { MinimalFooter } from "@/components/navigation/MinimalFooter";
import { ROUTES } from "@/config/navigation";

const ADMIN_ONLY_PREFIXES = ["/admin", "/dashboard", "/vault", "/internal"];

const NotFound = () => {
  usePageTracking('404');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    const isAdminPath = ADMIN_ONLY_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

    if (isAdminPath) {
      // Redirect to the lead capture funnel so the visitor continues their journey
      navigate(ROUTES.FREE_ESTIMATE, { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to={ROUTES.HOME} className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
};

export default NotFound;