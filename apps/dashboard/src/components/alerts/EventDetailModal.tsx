'use client';

import { useEffect, useState } from 'react';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { AlertTriangle, Clock, DollarSign, Users, RefreshCw, X, Check, AlertCircle, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRevoke } from '@/hooks/useRevoke';
import type { EventDetailResponse, ScoreBreakdown, TimelineEntry } from '@/types';

interface EventDetailModalProps {
  eventId: string | null;
  onClose: () => void;
  onDismiss?: (eventId: string) => void;
  onRefresh?: () => void;
}

export function EventDetailModal({ eventId, onClose, onDismiss, onRefresh }: EventDetailModalProps) {
  const [data, setData] = useState<EventDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeConfirmation, setRevokeConfirmation] = useState('');
  
  const { revoke, loading: revokeLoading } = useRevoke();
  const isRevoking = revoking || revokeLoading;

  useEffect(() => {
    if (!eventId) return;
    
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/alerts/${eventId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch event detail');
        }
        
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [eventId]);

  if (!eventId || loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>Loading event information...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse space-y-4 w-full max-w-md">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-border-default rounded" />)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>Failed to load event details</DialogDescription>
          </DialogHeader>
          <p className="text-risk-red-500">{error}</p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data) return null;

  const { event, timeline, score_breakdown, history } = data;
  const riskLevel = event.risk_score?.risk_level || 'green';
  const riskScore = event.risk_score?.total_score || 0;

  const riskColors = {
    green: 'bg-risk-green-50 border-risk-green-200 text-risk-green-700',
    yellow: 'bg-risk-yellow-50 border-risk-yellow-200 text-risk-yellow-700',
    red: 'bg-risk-red-50 border-risk-red-200 text-risk-red-700',
  };

  const riskIcons = {
    green: <Check className="h-5 w-5 text-risk-green-500" />,
    yellow: <AlertCircle className="h-5 w-5 text-risk-yellow-500" />,
    red: <AlertTriangle className="h-5 w-5 text-risk-red-500" />,
  };

  const timelineIcons = {
    purchase: <DollarSign className="h-4 w-4 text-primary-500" />,
    refund: <RefreshCw className="h-4 w-4 text-risk-red-500" />,
    score_calculated: <AlertTriangle className="h-4 w-4 text-risk-yellow-500" />,
    alert_created: <AlertCircle className="h-4 w-4 text-primary-500" />,
    email_sent: <ExternalLink className="h-4 w-4 text-risk-green-500" />,
    revoked: <Trash2 className="h-4 w-4 text-risk-red-500" />,
    dismissed: <X className="h-4 w-4 text-text-muted" />,
  };

  const handleRevoke = async () => {
    if (revokeConfirmation !== 'REVOKE') return;
    
    try {
      setRevoking(true);
      
      const result = await revoke(eventId, {
        app_user_id: event.app_user_id,
        entitlement_id: event.entitlement_id || '',
        confirmation: 'REVOKE',
      });
      
      if (result.success) {
        toast.success('Entitlement revoked successfully');
        if (onRefresh) onRefresh();
        onClose();
      } else {
        toast.error(result.error || 'Failed to revoke entitlement');
      }
    } catch (err) {
      console.error('Revoke failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to revoke entitlement');
    } finally {
      setRevoking(false);
      setShowRevokeConfirm(false);
      setRevokeConfirmation('');
    }
  };

  const handleDismiss = async () => {
    try {
      setDismissing(true);
      if (onDismiss) await onDismiss(eventId);
      toast.success('Alert dismissed');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Dismiss failed:', err);
      toast.error('Failed to dismiss alert');
    } finally {
      setDismissing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        {/* Risk Banner */}
        <div className={cn('mb-4 p-4 rounded-lg border', riskColors[riskLevel])}>
          <div className="flex items-center gap-3">
            {riskIcons[riskLevel]}
            <div>
              <p className="font-semibold text-lg">
                {riskLevel === 'red' ? 'HIGH RISK' : riskLevel === 'yellow' ? 'MEDIUM RISK' : 'LOW RISK'}
                {' '}
                <span className="font-mono text-sm">Score: {riskScore}/100</span>
              </p>
              <p className="text-sm opacity-80">{score_breakdown.primary_reason}</p>
            </div>
          </div>
        </div>

        {/* Event Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-text-muted">User ID</p>
              <p className="font-mono font-medium text-text-primary">{event.app_user_id}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-text-muted">Product</p>
              <p className="font-medium text-text-primary">{event.product_id}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-text-muted">Amount</p>
              <p className="font-bold text-text-primary">{formatCurrency(event.price_usd, event.currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-text-muted">Refunded</p>
              <p className="font-medium text-text-primary">{formatDateTime(event.refunded_at)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="score">Score Breakdown</TabsTrigger>
            <TabsTrigger value="history">User History</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="relative pl-4 border-l border-border-default">
              {timeline.map((entry, index) => (
                <div key={index} className="relative pb-6 last:pb-0">
                  <div className="absolute left-[-8px] top-0 w-3 h-3 rounded-full bg-bg-primary border-2 border-border-default flex items-center justify-center">
                    {timelineIcons[entry.type]}
                  </div>
                  <div className="ms-4">
                    <p className="font-medium text-text-primary">{entry.title}</p>
                    <p className="text-sm text-text-muted">{entry.description}</p>
                    <p className="text-xs text-text-muted mt-1">{formatDateTime(entry.timestamp)}</p>
                    {entry.metadata && (
                      <pre className="mt-2 text-xs bg-bg-tertiary p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Score Breakdown Tab */}
          <TabsContent value="score" className="space-y-4">
            <div className="space-y-4">
              <ScoreBar 
                label="Duration Before Refund" 
                score={score_breakdown.duration_score} 
                max={35} 
                color="primary"
                detail={`${score_breakdown.factors.duration_hours.toFixed(1)} hours between purchase and refund`}
              />
              <ScoreBar 
                label="Refund Frequency" 
                score={score_breakdown.frequency_score} 
                max={30} 
                color="risk-yellow"
                detail={`${score_breakdown.factors.refund_count} previous refund(s) by this user`}
              />
              <ScoreBar 
                label="Billing Cycle Proximity" 
                score={score_breakdown.billing_cycle_score} 
                max={20} 
                color="risk-red"
                detail={score_breakdown.factors.is_last_day_of_cycle ? 'Refunded on last day of billing cycle' : 'Not near billing cycle renewal'}
              />
              <ScoreBar 
                label="Product Type" 
                score={score_breakdown.product_type_score} 
                max={15} 
                color="risk-green"
                detail={score_breakdown.factors.is_consumable ? 'Consumable product (high risk)' : 'Subscription product'}
              />
              
              <div className="pt-4 border-t border-border-default">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Score</span>
                  <span className="font-bold text-2xl">{score_breakdown.total_score}/100</span>
                </div>
                <RiskBadge level={score_breakdown.risk_level} score={score_breakdown.total_score} size="lg" />
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{formatDateTime(h.refunded_at)}</TableCell>
                      <TableCell>{h.product_id}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(h.price_usd, h.currency)}</TableCell>
                      <TableCell>
                        {h.risk_score && <RiskBadge level={h.risk_score.risk_level} score={h.risk_score.total_score} size="sm" />}
                      </TableCell>
                      <TableCell>
                        {h.alert ? (
                          <Badge variant={h.alert.status === 'revoked' ? 'destructive' : 'outline'} className="capitalize">
                            {h.alert.status}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No Alert</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No previous refund history for this user</p>
              </div>
            )}
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw" className="space-y-4">
            <pre className="bg-bg-tertiary p-4 rounded overflow-auto max-h-96 text-xs font-mono">
              {JSON.stringify(event.raw_payload, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <DialogFooter className="border-t border-border-default mt-6">
          {event.risk_score && event.risk_score.risk_level !== 'green' && (
            <Button 
              variant="destructive" 
              onClick={() => setShowRevokeConfirm(true)}
              disabled={isRevoking || dismissing}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Revoke Entitlement
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            disabled={isRevoking || dismissing}
          >
            Dismiss Alert
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={isRevoking || dismissing}>
            Close
          </Button>
        </DialogFooter>

        {/* Revoke Confirmation Dialog */}
        <Dialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Entitlement Revocation</DialogTitle>
              <DialogDescription>
                This will immediately revoke the user's access to the entitlement. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-risk-red-50 border border-risk-red-200 rounded-lg">
                <p className="font-medium text-risk-red-700">User: {event.app_user_id}</p>
                <p className="text-sm text-risk-red-600">Entitlement: {event.entitlement_id || 'N/A'}</p>
                <p className="text-sm text-risk-red-600">Product: {event.product_id}</p>
              </div>
              <div>
                <label className="label">Type "REVOKE" to confirm</label>
                <Input
                  value={revokeConfirmation}
                  onChange={(e) => setRevokeConfirmation(e.target.value)}
                  placeholder="REVOKE"
                  className="font-mono text-lg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRevokeConfirm(false)} disabled={isRevoking}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRevoke}
                disabled={isRevoking || revokeConfirmation !== 'REVOKE'}
              >
                {isRevoking ? 'Revoking...' : 'Revoke Entitlement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function ScoreBar({ label, score, max, color, detail }: { label: string; score: number; max: number; color: string; detail: string }) {
  const percentage = (score / max) * 100;
  const colorClasses = {
    primary: 'bg-primary-500',
    'risk-yellow': 'bg-risk-yellow-500',
    'risk-red': 'bg-risk-red-500',
    'risk-green': 'bg-risk-green-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="font-mono text-text-secondary">{score}/{max}</span>
      </div>
      <Progress value={percentage} className="h-2" max={100}>
        <div className={cn('h-full rounded', colorClasses[color as keyof typeof colorClasses])} />
      </Progress>
      <p className="text-xs text-text-muted mt-1">{detail}</p>
    </div>
  );
}