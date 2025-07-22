"use client"
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const AuthErrorPage: React.FC = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-[#11141a] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Link href="/" className="inline-block mb-8">
            <Image src="/icons/logo.svg" alt="Infercircle" width={48} height={48} className="mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-red-400 mb-4">Authentication Error</h2>
          <p className="text-gray-400 mb-8">{getErrorMessage(error)}</p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/auth/signin" 
            className="w-full inline-block px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </Link>
          <Link 
            href="/" 
            className="w-full inline-block px-4 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage;
