'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ForgotPasswordInput>>({});

  const supabase = createClient();

  const validateForm = (): boolean => {
    const result = forgotPasswordSchema.safeParse({ email });
    
    if (!result.success) {
      const newErrors: Partial<ForgotPasswordInput> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof ForgotPasswordInput;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('Password reset email sent! Check your inbox.');
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      description="Enter your email and we'll send you a link to reset your password"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="email"
                type="email"
                placeholder="you@app.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateForm()}
                className={`pl-9 ${errors.email ? 'border-risk-red-500 focus:border-risk-red-500 focus:ring-risk-red-500/20' : ''}`}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-risk-red-500" role="alert">
                  {errors.email}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
        
        <CardFooter className="flex flex-col space-y-4 p-0 bg-transparent border-none">
          <p className="text-center text-sm text-text-muted">
            Remember your password?{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary-500 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthLayout>
  );
}