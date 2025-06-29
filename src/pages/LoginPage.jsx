import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { setPaid } from '@/utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error('Verification failed');
        const data = await res.json();
        if (data.success) {
          setPaid(true);
          setStatus('success');
          toast({ title: 'Logged in', description: 'Welcome back! Enjoy unlimited access.' });
          setTimeout(() => navigate('/'), 1200);
        } else throw new Error('Verification failed');
      } catch (err) {
        console.error(err);
        setStatus('error');
        toast({ title: 'Login failed', description: 'The link is invalid or expired.', variant: 'destructive' });
      }
    })();
  }, [token, email]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white px-6" style={{ maxWidth: 500, margin: '0 auto' }}>
      {status === 'verifying' && (
        <div className="w-full">
          <Skeleton className="h-6 w-32 mb-4 bg-white/30" />
          <Skeleton className="h-10 w-full bg-white/20" />
          <p className="text-center mt-6 text-sm text-white/80">Verifying your magic link…</p>
        </div>
      )}
      {status === 'success' && (
        <p className="text-xl font-semibold text-center">Success! Redirecting…</p>
      )}
      {status === 'error' && (
        <div className="text-center space-y-3">
          <p className="text-xl font-semibold">Link invalid or expired.</p>
          <button className="px-4 py-2 bg-white/20 rounded-xl" onClick={() => navigate('/')}>Go Home</button>
        </div>
      )}
    </div>
  );
} 