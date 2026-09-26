'use client';

import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Shield className="h-10 w-10 text-primary-500" />
            <span className="text-2xl font-bold text-text-primary">RefundRadar</span>
          </Link>
          <p className="text-text-secondary">
            {description || 'Automated refund abuse detection for mobile apps'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8">
          {title && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            </div>
          )}
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-6">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-primary-500 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-primary-500 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}