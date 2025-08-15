'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Plus, Check, Search, Filter, X } from 'lucide-react';

interface InviteCode {
  InviteCode: string;
  email?: string;
  username?: string;
  used: boolean;
}

interface Filters {
  status: 'all' | 'used' | 'unused';
  search: string;
  email: string;
  username: string;
}

export default function InviteCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<InviteCode[]>([]);
  const [newCodeData, setNewCodeData] = useState({ email: '', username: '' });
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    search: '',
    email: '',
    username: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...inviteCodes];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(code => 
        filters.status === 'used' ? code.used : !code.used
      );
    }

    // Filter by search term (searches in invite code, email, and username)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(code =>
        code.InviteCode.toLowerCase().includes(searchTerm) ||
        code.email?.toLowerCase().includes(searchTerm) ||
        code.username?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by email
    if (filters.email) {
      filtered = filtered.filter(code =>
        code.email?.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    // Filter by username
    if (filters.username) {
      filtered = filtered.filter(code =>
        code.username?.toLowerCase().includes(filters.username.toLowerCase())
      );
    }

    setFilteredCodes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [inviteCodes, filters]);

  const clearFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      email: '',
      username: ''
    });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.search || filters.email || filters.username;

  // Pagination
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = filteredCodes.slice(startIndex, startIndex + itemsPerPage);

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
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    );
  }

  if (!session?.user?.email || !authorizedEmails.includes(session.user.email.toLocaleLowerCase())) {
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
                  placeholder="Twitter username"
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Generated Invite Codes</CardTitle>
                <CardDescription className="text-gray-400">
                  {filteredCodes.length} of {inviteCodes.length} invite codes
                  {hasActiveFilters && ' (filtered)'}
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search invite codes, email, or username..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-[#23272b] border-[#2d3338] text-white placeholder-gray-400"
                />
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="p-4 bg-[#23272b] rounded-lg border border-[#2d3338] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Advanced Filters</h3>
                    {hasActiveFilters && (
                      <Button
                        onClick={clearFilters}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Status</Label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as 'all' | 'used' | 'unused' })}
                        className="w-full bg-[#2d3338] border border-[#3d4148] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A259FF]"
                      >
                        <option value="all" className="bg-[#2d3338] text-white">All</option>
                        <option value="unused" className="bg-[#2d3338] text-white">Available</option>
                        <option value="used" className="bg-[#2d3338] text-white">Used</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">Email</Label>
                      <Input
                        placeholder="Filter by email..."
                        value={filters.email}
                        onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                        className="bg-[#2d3338] border-[#3d4148] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">Username</Label>
                      <Input
                        placeholder="Filter by username..."
                        value={filters.username}
                        onChange={(e) => setFilters({ ...filters, username: e.target.value })}
                        className="bg-[#2d3338] border-[#3d4148] text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredCodes.length === 0 ? (
              <div className="text-center py-8">
                {inviteCodes.length === 0 ? (
                  <p className="text-gray-400">No invite codes generated yet</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400">No invite codes match your filters</p>
                    <Button
                      onClick={clearFilters}
                      variant="ghost"
                      size="sm"
                      className="text-[#A259FF] hover:text-white"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-3 bg-[#2d3338] rounded-lg text-sm font-medium text-gray-300">
                  <div className="col-span-3">Invite Code</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-3">Username</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Action</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {paginatedCodes.map((code) => (
                    <div
                      key={code.InviteCode}
                      className="grid grid-cols-12 gap-4 p-3 bg-[#23272b] rounded-lg border border-[#2d3338] hover:border-[#3d4148] transition-colors"
                    >
                      <div className="col-span-3 flex items-center">
                        <code className="text-[#A259FF] font-mono text-sm bg-[#2d3338] px-2 py-1 rounded">
                          {code.InviteCode}
                        </code>
                      </div>
                      
                      <div className="col-span-3 flex items-center">
                        <span className="text-white text-sm truncate">
                          {code.email || (
                            <span className="text-gray-500 italic">No email</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="col-span-3 flex items-center">
                        <span className="text-white text-sm truncate">
                          {code.username || (
                            <span className="text-gray-500 italic">No username</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          code.used 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {code.used ? 'Used' : 'Available'}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center">
                        <Button
                          onClick={() => copyToClipboard(code.InviteCode)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white p-1"
                        >
                          {copiedCode === code.InviteCode ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCodes.length)} of {filteredCodes.length} results
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, index, arr) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && arr[index - 1] !== page - 1 && (
                                <span className="text-gray-400 px-1">...</span>
                              )}
                              <Button
                                onClick={() => setCurrentPage(page)}
                                variant={currentPage === page ? "default" : "ghost"}
                                size="sm"
                                className={currentPage === page 
                                  ? "bg-[#A259FF] hover:bg-[#8B4DFF] text-white" 
                                  : "text-gray-400 hover:text-white"
                                }
                              >
                                {page}
                              </Button>
                            </div>
                          ))
                        }
                      </div>
                      
                      <Button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
