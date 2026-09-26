'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Copy, Check, Loader2, Key, Shield, Globe, RefreshCw } from 'lucide-react';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { toast } from 'sonner';
import type { RevenueCatConnectionStatus } from '@/types';

export function RevenueCatForm() {
  const { status, loading, validateAndSave, validateKey, fetchStatus } = useRevenueCat();
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; appsFound: number } | null>(null);

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setValidating(true);
    try {
      const result = await validateKey(apiKey);
      setValidationResult(result);
      if (result.valid) {
        toast.success(`Valid API key - ${result.appsFound} app(s) found`);
      } else {
        toast.error('Invalid API key');
      }
    } catch (err) {
      toast.error('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !webhookSecret.trim()) {
      toast.error('Please enter both API key and webhook secret');
      return;
    }

    setSaving(true);
    try {
      await validateAndSave(apiKey, webhookSecret);
      toast.success('Credentials saved and apps synced!');
      fetchStatus();
    } catch (err) {
      toast.error('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>Current RevenueCat integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-3 h-3 rounded-full',
                status?.is_valid ? 'bg-risk-green-500' : 'bg-risk-red-500'
              )} />
              <div>
                <p className="font-medium">
                  {status?.is_valid ? 'Connected' : 'Not Connected'}
                </p>
                <p className="text-sm text-text-muted">
                  {status?.has_credentials 
                    ? `API Key: ${status.api_key_prefix} • ${status.apps_found} app(s) synced`
                    : 'No credentials configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.last_validated_at && (
                <span className="text-sm text-text-muted">
                  Last validated: {new Date(status.last_validated_at).toLocaleString()}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {status?.is_valid && status.apps_found > 0 && (
            <div className="p-4 bg-bg-tertiary rounded-lg">
              <p className="font-medium mb-2">Synced Apps:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: status.apps_found }, (_, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    <Globe className="h-3 w-3" />
                    App {i + 1}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Credentials
          </CardTitle>
          <CardDescription>
            Enter your RevenueCat V2 Secret API Key and Webhook Secret.
            Find these in your RevenueCat dashboard under Project Settings → API Keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">RevenueCat V2 Secret Key *</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder="rc_v2_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={saving}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <AlertCircle className="h-4 w-4" /> : <Key className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-text-muted">
              Starts with <code>rc_v2_</code> or <code>rc_live_</code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret *</Label>
            <div className="relative">
              <Input
                id="webhook-secret"
                type={showWebhookSecret ? 'text' : 'password'}
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                disabled={saving}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                aria-label={showWebhookSecret ? 'Hide webhook secret' : 'Show webhook secret'}
              >
                {showWebhookSecret ? <AlertCircle className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleValidate} 
              disabled={validating || !apiKey.trim()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {validating ? 'Validating...' : 'Validate API Key'}
            </Button>
            {validationResult?.valid && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid - {validationResult.appsFound} app(s)
              </Badge>
            )}
            {validationResult && !validationResult.valid && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Invalid API Key
              </Badge>
            )}
          </div>

          <Separator />

          <Button 
            onClick={handleSave} 
            disabled={saving || !apiKey.trim() || !webhookSecret.trim()}
            className="w-full gap-2"
          >
            <Shield className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Credentials'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}