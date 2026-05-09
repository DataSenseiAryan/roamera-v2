'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, X } from 'lucide-react';

const SCOPE_LABELS: Record<string, string> = {
  'trips:read': 'Read your trips and itineraries',
  'trips:write': 'Create and edit trips',
  'budget:read': 'View trip budgets and expenses',
  'packing:read': 'View packing lists',
  'packing:write': 'Update packing item status',
  'atlas:read': 'See visited countries',
  'notifications:read': 'Read your notifications',
};

interface ConsentInfo {
  client_name: string;
  scopes: string[];
  redirect_uri: string;
  state?: string;
  code_challenge: string;
  code_challenge_method: string;
  client_id: string;
}

export default function OAuthAuthorizePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [info, setInfo] = useState<ConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const code_challenge = searchParams.get('code_challenge');
  const code_challenge_method = searchParams.get('code_challenge_method') ?? 'S256';
  const scope = searchParams.get('scope');

  useEffect(() => {
    if (!client_id || !redirect_uri || !code_challenge) {
      setError('Missing required OAuth parameters');
      setLoading(false);
      return;
    }

    // Fetch consent info from API
    const params = new URLSearchParams({ client_id, redirect_uri, code_challenge, code_challenge_method });
    if (state) params.set('state', state);
    if (scope) params.set('scope', scope);

    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/v1/mcp/oauth/authorize?${params}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error_description ?? data.error);
        setInfo(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [client_id, redirect_uri, code_challenge, code_challenge_method, state, scope]);

  const handleDecision = async (approved: boolean) => {
    if (!info) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/v1/mcp/oauth/authorize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            client_id: info.client_id,
            redirect_uri: info.redirect_uri,
            state: info.state,
            code_challenge: info.code_challenge,
            code_challenge_method: info.code_challenge_method,
            scopes: info.scopes,
            approved,
          }),
        },
      );
      const data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (e) {
      setError('Authorization failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="py-8 text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-950">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl">Authorize Access</CardTitle>
          <CardDescription>
            <strong className="text-foreground">{info?.client_name}</strong> is requesting access to your Roamera account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Requested scopes */}
          <div>
            <p className="text-sm font-semibold mb-3">This application will be able to:</p>
            <div className="space-y-2">
              {(info?.scopes ?? []).map(scope => (
                <div key={scope} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-sm">{SCOPE_LABELS[scope] ?? scope}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can revoke this access anytime from{' '}
            <a href="/settings/mcp" className="text-teal-600 underline">Settings → MCP Tokens</a>
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleDecision(false)}
              disabled={submitting}
            >
              Deny
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={() => handleDecision(true)}
              disabled={submitting}
            >
              {submitting ? 'Authorizing...' : 'Allow'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
