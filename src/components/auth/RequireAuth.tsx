import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SetupRequired from './SetupRequired';

/** Renders children only for a signed-in user; otherwise sends them to /login. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();
  const location = useLocation();

  if (!configured) return <SetupRequired />;
  if (loading) {
    return (
      <div className="app-backdrop grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" aria-label="Loading" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
