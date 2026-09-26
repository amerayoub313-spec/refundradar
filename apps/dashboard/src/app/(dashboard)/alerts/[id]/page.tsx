import { EventDetailModal } from '@/components/alerts';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

interface AlertDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: AlertDetailPageProps) {
  const { id } = await params;
  
  // Redirect to alerts page with eventId query param to open modal
  redirect(`/alerts?eventId=${id}`);
}