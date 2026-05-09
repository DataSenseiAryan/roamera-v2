'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Key, Plus, Trash2 } from 'lucide-react';

interface McpToken {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
}

const ALL_SCOPES = [
  { key: 'trips:read', label: 'Read trips' },
  { key: 'trips:write', label: 'Create/edit trips' },
  { key: 'budget:read', label: 'Read budget' },
  { key: 'packing:read', label: 'Read packing lists' },
  { key: 'packing:write', label: 'Update packing items' },
  { key: 'atlas:read', label: 'Read atlas/visited countries' },
  { key: 'notifications:read', label: 'Read notifications' },
];

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

export default function McpSettingsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(ALL_SCOPES.map(s => s.key));
  const [newToken, setNewToken] = useState<string | null>(null);

  const { data: tokens = [] } = useQuery<McpToken[]>({
    queryKey: ['mcp-tokens'],
    queryFn: () => apiFetch('/api/v1/mcp/tokens'),
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch('/api/v1/mcp/tokens', {
      method: 'POST',
      body: JSON.stringify({ name, scopes: selectedScopes }),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mcp-tokens'] });
      setNewToken(data.token);
      setName('');
      toast.success('Token created!');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/mcp/tokens/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcp-tokens'] });
      toast.success('Token revoked');
    },
  });

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope],
    );
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MCP Token Management</h1>
        <p className="text-muted-foreground mt-2">
          Create static tokens to connect Claude Desktop or other AI assistants to your Roamera data.
        </p>
      </div>

      {/* Usage instructions */}
      <Card className="mb-8 border-teal-200 dark:border-teal-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-600" />
            Connect to Claude Desktop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Add this to your <code className="bg-muted px-1 py-0.5 rounded text-xs">claude_desktop_config.json</code>:
          </p>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
{`{
  "mcpServers": {
    "roamera": {
      "url": "${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/v1/mcp/server",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Create Token Dialog */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Tokens</h2>
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setNewToken(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create MCP Token</DialogTitle>
            </DialogHeader>
            {newToken ? (
              <div className="space-y-4">
                <p className="text-sm text-amber-600 font-medium">
                  ⚠️ Copy this token now — it will never be shown again!
                </p>
                <div className="flex gap-2">
                  <Input value={newToken} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToken(newToken)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="w-full" onClick={() => { setOpen(false); setNewToken(null); }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="token-name">Token Name</Label>
                  <Input
                    id="token-name"
                    placeholder="e.g. Claude Desktop"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Scopes</Label>
                  <div className="space-y-2">
                    {ALL_SCOPES.map(scope => (
                      <div key={scope.key} className="flex items-center gap-2">
                        <Checkbox
                          id={scope.key}
                          checked={selectedScopes.includes(scope.key)}
                          onCheckedChange={() => toggleScope(scope.key)}
                        />
                        <Label htmlFor={scope.key} className="font-normal cursor-pointer">
                          {scope.label}
                          <span className="ml-2 text-xs text-muted-foreground font-mono">{scope.key}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => createMutation.mutate()}
                  disabled={!name || selectedScopes.length === 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Token'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Token List */}
      <div className="space-y-3">
        {tokens.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No MCP tokens yet. Create one to connect AI assistants.</p>
            </CardContent>
          </Card>
        ) : tokens.map(token => (
          <Card key={token.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{token.name}</h3>
                    <Badge variant="outline" className="text-teal-600 border-teal-200">Active</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(token.scopes as string[]).map(scope => (
                      <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(token.createdAt).toLocaleDateString()}
                    {token.lastUsedAt && ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => revokeMutation.mutate(token.id)}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
