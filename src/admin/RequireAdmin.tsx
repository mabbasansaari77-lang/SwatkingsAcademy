import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/States';
import { useAuth } from '../lib/auth';

/**
 * Shows admin pages only to signed-in users whose profile role is 'admin'.
 * This is a convenience for the interface. The real protection is the Row
 * Level Security in the database: even if someone bypassed this screen, the
 * database would refuse to return or change private data.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="p-8">
        <Loading label="Checking your access" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chalk p-6">
        <div role="alert" className="max-w-md bg-white p-8 shadow-sm">
          <ShieldAlert className="h-10 w-10 text-cherry" aria-hidden="true" />
          <h1 className="mt-3 text-3xl font-extrabold text-navy-900">No admin access</h1>
          <p className="mt-2 text-charcoal-600">
            You are signed in as {session.user.email}, but this account has not been given the admin role. Ask the
            academy’s main administrator to grant access.
          </p>
          <Button className="mt-6" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
