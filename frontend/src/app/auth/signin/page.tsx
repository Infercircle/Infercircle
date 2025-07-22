"use client"
import React from "react";
import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { FaGoogle, FaTwitter } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

const SignInPage: React.FC = () => {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

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

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'bg-red-600 hover:bg-red-700';
      case 'twitter':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-violet-600 hover:bg-violet-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#11141a] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <Image src="/icons/logo.svg" alt="Infercircle" width={48} height={48} className="mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400">Sign in to your account to continue</p>
        </div>

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-white font-medium transition-colors ${getProviderColor(provider.id)}`}
              >
                <span className="mr-3">
                  {getProviderIcon(provider.id)}
                </span>
                Sign in with {provider.name}
              </button>
            ))}
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Don&apos;t have an account?{" "}
            <span className="text-violet-400">Sign up by connecting your social account</span>
          </p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
