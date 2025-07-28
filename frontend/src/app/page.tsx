"use client";
import Navbar from "@/components/Navbar";
import { InviteCodeModal } from "@/components/InviteCodeModal";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import { FaGoogle, FaTwitter } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
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
        return <FaGoogle size={20} />;
      case 'twitter':
        return <FaTwitter size={20} />;
      default:
        return null;
    }
  };

  // If user is authenticated, redirect or show different content
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navbar showAuthButtons={true} showConnectWallet={false} showSearch={false} />
        {(user && !user.inviteAccepted) ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
            <InviteCodeModal inviteCode={inviteCode} setInviteCode={setInviteCode} addX={!user.email || !user.username} />
          </div>
        ):(
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
            <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Link href="/" className="inline-block mb-4">
                  <Image src="/icons/logo.svg" alt="Infercircle" width={48} height={48} className="mx-auto" />
                </Link>
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

  // Sign in form for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar showAuthButtons={false} showConnectWallet={false} showSearch={false} />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="inline-block">
              <Image src="/icons/logo.svg" alt="Infercircle" width={100} height={100} className="mx-auto" />
            </Link>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Hii There!</CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Sign in to your account to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">            
            {providers &&
              Object.values(providers)
                .map((provider) => (
                  <Button
                    key={provider.name}
                    onClick={() => signIn(provider.id, { callbackUrl: `/` })}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-11 cursor-pointer"
                  >
                    <span className="mr-3">
                      {getProviderIcon(provider.id)}
                    </span>
                    Sign in with {provider.name}
                  </Button>
                ))}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">We are in beta! Invite Code access Only</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
