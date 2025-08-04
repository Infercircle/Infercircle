'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Plus, Check } from 'lucide-react';

interface InviteCode {
  InviteCode: string;
  email?: string;
  username?: string;
  used: boolean;
}

export default function InviteCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [newCodeData, setNewCodeData] = useState({ email: '', username: '' });
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const authorizedEmails = ['infercircle@gmail.com', 'kesharwanis084@gmail.com'];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user is authorized
    if (!session.user?.email || !authorizedEmails.includes(session.user.email.toLocaleLowerCase())) {
      router.push('/dashboard');
      return;
    }

    fetchInviteCodes();
  }, [session, status, router]);

  const fetchInviteCodes = async () => {
    try {
      const response = await fetch('/api/invite-code/generate', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setInviteCodes(data.inviteCodes || []);
      }
    } catch (error) {
      console.error('Error fetching invite codes:', error);
    }
  };

  const generateInviteCode = async () => {
    setLoading(true);
    setAlert(null);

    try {
      const response = await fetch('/api/invite-code/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCodeData),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({ message: 'Invite code generated successfully!', type: 'success' });
        setNewCodeData({ email: '', username: '' });
        fetchInviteCodes(); // Refresh the list
      } else {
        setAlert({ message: data.error || 'Failed to generate invite code', type: 'error' });
      }
    } catch (error) {
      setAlert({ message: 'An error occurred while generating the invite code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session?.user?.email || !authorizedEmails.includes(session.user.email)) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center">
        <div className="text-white">Unauthorized access</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Invite Code Generator</h1>
          <p className="text-gray-400">Generate invite codes for new users</p>
        </div>

        {/* Generate New Invite Code */}
        <Card className="bg-[#181c20] border-[#23272b]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Generate New Invite Code
            </CardTitle>
            <CardDescription className="text-gray-400">
              Create a new invite code with optional email and username
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newCodeData.email}
                  onChange={(e) => setNewCodeData({ ...newCodeData, email: e.target.value })}
                  className="bg-[#23272b] border-[#2d3338] text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username (Optional)</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={newCodeData.username}
                  onChange={(e) => setNewCodeData({ ...newCodeData, username: e.target.value })}
                  className="bg-[#23272b] border-[#2d3338] text-white placeholder-gray-400"
                />
              </div>
            </div>
            
            {alert && (
              <Alert className={`${alert.type === 'error' ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'}`}>
                <AlertDescription className={alert.type === 'error' ? 'text-red-400' : 'text-green-400'}>
                  {alert.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={generateInviteCode}
              disabled={loading}
              className="w-full bg-[#A259FF] hover:bg-[#8B4DFF] text-white"
            >
              {loading ? 'Generating...' : 'Generate Invite Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Invite Codes */}
        <Card className="bg-[#181c20] border-[#23272b]">
          <CardHeader>
            <CardTitle className="text-white">Generated Invite Codes</CardTitle>
            <CardDescription className="text-gray-400">
              All generated invite codes and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inviteCodes.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No invite codes generated yet</p>
            ) : (
              <div className="space-y-3">
                {inviteCodes.map((code) => (
                  <div
                    key={code.InviteCode}
                    className="flex items-center justify-between p-4 bg-[#23272b] rounded-lg border border-[#2d3338]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="text-[#A259FF] font-mono text-sm bg-[#2d3338] px-2 py-1 rounded">
                          {code.InviteCode}
                        </code>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          code.used 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {code.used ? 'Used' : 'Available'}
                        </span>
                      </div>
                      {(code.email || code.username) && (
                        <div className="mt-2 text-sm text-gray-400">
                          {code.email && <span>Email: {code.email}</span>}
                          {code.email && code.username && <span className="mx-2">•</span>}
                          {code.username && <span>Username: {code.username}</span>}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(code.InviteCode)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedCode === code.InviteCode ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
