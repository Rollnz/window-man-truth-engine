import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";

import { SEO } from "@/components/SEO";
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
      // Redirect to Admin Home so admin users stay in the admin context
      navigate('/admin', { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Return to our homepage to explore free window replacement tools and resources."
      />
      <div className="flex flex-1 items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <Link to={ROUTES.HOME} className="text-primary underline hover:text-primary/90">
            Return to Home
          </Link>
        </div>
      </div>

    </div>
  );
};

export default NotFound;