"use client";
import Navbar from "@/components/Navbar";
import { InviteCodeModal } from "@/components/InviteCodeModal";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import { FaGoogle, FaTwitter, FaRocket, FaChartLine, FaShieldAlt, FaUsers, FaUser } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { BsTwitterX } from "react-icons/bs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");

  useEffect(() => {
    console.log("Session: ", session);
    console.log("User: ", session?.user);
    if (session?.user && 'id' in session.user) {
      const fetchedUser = session.user as User;
      setUser(fetchedUser);
      if (fetchedUser && fetchedUser.inviteAccepted) {
        window.location.href = `${fetchedUser.username && fetchedUser.username.length > 0 ? `/dashboard` : `/dashboard?addX=true`}`;
      }
    }
    console.log("Fetched User: ", user);
  }, [session?.user]);

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  console.log("User: ", user);

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <FcGoogle size={20} />;
      case 'twitter':
        return <BsTwitterX size={20} />;
      default:
        return null;
    }
  };

  // If user is authenticated, redirect or show different content
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar showAuthButtons={true} showConnectWallet={false} showSearch={false} />
        {(user && !user.inviteAccepted) ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
            <InviteCodeModal inviteCode={inviteCode} setInviteCode={setInviteCode} addX={!user.email || !user.username} />
          </div>
        ):(
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
            <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Welcome back!</CardTitle>
                <CardDescription className="text-gray-400">
                  You are already signed in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  asChild 
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Link href="/">Back to Home</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Modern split-screen landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar showAuthButtons={false} showConnectWallet={false} showSearch={false} />
      
      {/* Split Screen Layout */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-8 lg:px-16 xl:px-24 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
          <div className="max-w-2xl">
            {/* Hero Content */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                Your Personal
                <span className="block bg-gradient-to-r from-violet-400 via-purple-400 to-violet-600 bg-clip-text text-transparent">
                  Analytic Tool
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Curated analytics, real-time insights, and AI-powered sentiment analysis. All tailored for you.
              </p>
              
              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <FaChartLine className="text-violet-400 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Real-time Analytics</h3>
                    <p className="text-gray-400 text-sm">Live market data and portfolio tracking</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FaUsers className="text-blue-400 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Personalized</h3>
                    <p className="text-gray-400 text-sm">No two users have the same insight.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaShieldAlt className="text-purple-400 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Secure & Private</h3>
                    <p className="text-gray-400 text-sm">Your data stays yours, always</p>
                  </div>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="mt-8">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-violet-500/25 transition-all duration-300"
                >
                  <FaRocket className="mr-2" />
                  Get Early Access
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Authentication */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-8 xl:px-16 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
          <div className="w-full max-w-md">
            {/* Mobile Hero (shown only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Your Personal
                <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Analytic Tool
                </span>
              </h1>
              <p className="text-gray-300">Curated analytics, real-time insights, and AI-powered sentiment analysis. All tailored for you.</p>
            </div>
            
            {/* Auth Card */}
            <Card className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/10">
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-3">
                    <FaUser className="text-violet-400 text-xl" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Join Us Now</CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      Sign in to access your personalized crypto dashboard
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8 mt-[-15px!important]">            
                {providers &&
                  Object.values(providers)
                    .map((provider) => (
                      <Button
                        key={provider.name}
                        onClick={() => signIn(provider.id, { callbackUrl: `/` })}
                        variant="outline"
                        className="w-full border-white/[0.12] text-gray-300 hover:bg-white/[0.03] hover:text-white h-12 cursor-pointer transition-all duration-300 hover:border-violet-400/30 hover:shadow-lg hover:shadow-violet-500/10"
                      >
                        <span className="mr-3">
                          {getProviderIcon(provider.id)}
                        </span>
                        Sign in with {provider.id === 'twitter' ? 'X (formerly Twitter)' : provider.name}
                      </Button>
                    ))}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0a0a0a] px-3 text-gray-400 font-medium">Beta Access Only</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need an invite code? Contact us on X:{" "}
                <a href="https://twitter.com/infercircle" className="text-violet-400 hover:text-violet-300">
                  @infercircle
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
