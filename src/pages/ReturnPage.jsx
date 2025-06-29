import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { setPaid } from '@/utils/auth';
import { Toaster } from '@/components/ui/toaster';

export default function ReturnPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, failed

  useEffect(() => {
    if (!sessionId) {
      setStatus('failed');
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/session-status?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) throw new Error('Bad');
        const data = await res.json();
        if (data.status === 'complete') {
          setPaid(true);
          setStatus('success');
          toast({ title: 'Payment successful 🎉', description: 'You now have unlimited access.' });
          setTimeout(() => navigate('/chat'), 1500);
        } else if (data.status === 'expired') {
          setStatus('failed');
        } else {
          setTimeout(poll, 2000); // keep polling
        }
      } catch (err) {
        console.error(err);
        setStatus('failed');
      }
    };

    poll();
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white px-6" style={{ maxWidth: 500, margin: '0 auto' }}>
      {status === 'loading' && (
        <>
          <Skeleton className="h-6 w-40 mb-4 bg-white/30" />
          <Skeleton className="h-10 w-full bg-white/20" />
          <p className="mt-6 text-sm text-white/80 text-center">Processing your payment…</p>
        </>
      )}
      {status === 'success' && <p className="text-xl font-semibold">Success! Redirecting…</p>}
      {status === 'failed' && (
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">Payment not completed.</p>
          <button className="px-4 py-2 bg-white/20 rounded-xl" onClick={() => navigate('/paywall')}>Try again</button>
        </div>
      )}
      <Toaster />
    </div>
  );
} 