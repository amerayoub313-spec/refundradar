'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { signupSchema, type SignupInput } from '@/lib/validations';

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignupInput>>({});

  const supabase = createClient();

  const validateForm = (): boolean => {
    const result = signupSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Partial<SignupInput> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof SignupInput;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleChange = (field: keyof SignupInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success('Account created! Please check your email to verify your account.');
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SignupInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start protecting your app revenue from refund abuse today"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                onBlur={() => validateForm()}
                className={`pl-9 ${errors.full_name ? 'border-risk-red-500 focus:border-risk-red-500 focus:ring-risk-red-500/20' : ''}`}
                disabled={loading}
                autoComplete="name"
                autoFocus
              />
              {errors.full_name && (
                <p className="mt-1.5 text-sm text-risk-red-500" role="alert">
                  {errors.full_name}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="email"
                type="email"
                placeholder="you@app.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => validateForm()}
                className={`pl-9 ${errors.email ? 'border-risk-red-500 focus:border-risk-red-500 focus:ring-risk-red-500/20' : ''}`}
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-risk-red-500" role="alert">
                  {errors.email}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => validateForm()}
                className={`pl-9 pr-10 ${errors.password ? 'border-risk-red-500 focus:border-risk-red-500 focus:ring-risk-red-500/20' : ''}`}
                disabled={loading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                <Lock className="h-4 w-4 text-text-muted" />
              </Button>
              {errors.password && (
                <p className="mt-1.5 text-sm text-risk-red-500" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              Must be at least 8 characters
            </p>
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => validateForm()}
                className={`pl-9 ${errors.confirmPassword ? 'border-risk-red-500 focus:border-risk-red-500 focus:ring-risk-red-500/20' : ''}`}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-risk-red-500" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
        
        <CardFooter className="flex flex-col space-y-4 p-0 bg-transparent border-none">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-primary px-2 text-text-muted">Or continue with</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              toast.info('GitHub OAuth coming soon');
            }}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </Button>
          
          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary-500 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthLayout>
  );
}

function SignupForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <SignupFormContent />
    </Suspense>
  );
}

export default function SignupPage() {
  return <SignupForm />;
}