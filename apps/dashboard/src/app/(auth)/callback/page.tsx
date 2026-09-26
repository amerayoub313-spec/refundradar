'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (error) {
        toast.error(errorDescription || 'Authentication failed');
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      const code = searchParams.get('code');
      const next = searchParams.get('next');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          toast.error('Failed to verify account');
          router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
          return;
        }
        
        toast.success('Account verified successfully!');
        router.push(redirectTo);
        router.refresh();
      } else if (next) {
        // OAuth redirect
        router.push(redirectTo);
        router.refresh();
      } else {
        router.push(redirectTo);
      }
    };

    handleAuthCallback();
  }, [searchParams, router, redirectTo]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Processing...</CardTitle>
          <CardDescription>Please wait while we verify your account</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </CardContent>
      </Card>
    </div>
  );
}