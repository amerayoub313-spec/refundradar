import { AuthLayout } from '@/components/layout/AuthLayout';

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}