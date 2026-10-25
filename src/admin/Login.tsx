import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Logo } from '../components/graphics/Logo';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Login() {
  const { session, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session && isAdmin) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo light />
        </div>
        <form onSubmit={onSubmit} className="space-y-5 bg-crease p-7 shadow-xl" noValidate>
          <h1 className="text-3xl font-extrabold text-navy-900">Staff sign in</h1>
          {!isSupabaseConfigured && (
            <p role="alert" className="rounded bg-accent-300/40 p-3 text-sm">
              The database is not connected. Add your Supabase URL and key to <code>.env.local</code> first.
            </p>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-cherry">
              <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy || !email || !password || !isSupabaseConfigured}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
          <p className="text-sm text-charcoal-600">
            There is no public sign-up. Admin accounts are created by the academy in Supabase.
          </p>
        </form>
        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-crease/70 hover:text-crease">
            Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
