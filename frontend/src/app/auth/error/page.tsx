"use client"
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaExclamationTriangle, FaShieldAlt, FaArrowLeft, FaRedo } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AuthErrorPageContent: React.FC = () => {
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Split Screen Layout */}
      <div className="flex min-h-screen">
        {/* Left Side - Error Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-8 lg:px-16 xl:px-24 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
          <div className="max-w-2xl">
            {/* Error Hero Content */}
            <div className="space-y-6">
              <div className="mb-6">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight text-left">
                  Authentication
                  <span className="block bg-gradient-to-r from-red-400 via-orange-400 to-red-600 bg-clip-text text-transparent">
                    Error
                  </span>
                </h1>
              </div>
              
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                We encountered an issue with your authentication. Don't worry, this is usually temporary and can be resolved quickly.
              </p>
              
              {/* Error Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                    <FaShieldAlt className="text-red-600 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Security First</h3>
                    <p className="text-gray-400 text-sm">Your security is our priority</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <FaRedo className="text-orange-400 text-lg" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Quick Recovery</h3>
                    <p className="text-gray-400 text-sm">Most issues resolve instantly</p>
                  </div>
                </div>
              </div>
              
              {/* Help Text */}
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-gray-300 text-sm">
                  If this issue persists, please contact our support team on X:{" "}
                  <a href="https://twitter.com/infercircle" className="text-red-400 hover:text-red-300">
                    @infercircle
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Error Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-8 xl:px-16 bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
          <div className="w-full max-w-md">
            {/* Mobile Error Hero (shown only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <p className="text-gray-300">We encountered an issue with your authentication.</p>
            </div>
            
            {/* Error Card */}
            <Card className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/10">
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mb-3">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Authentication Error</CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      {getErrorMessage(error)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">            
                <Button 
                  asChild
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 cursor-pointer transition-all duration-300"
                >
                  <Link href="/auth/signin">
                    <FaRedo className="mr-3" />
                    Try Again
                  </Link>
                </Button>

                <Button 
                  variant="outline"
                  asChild
                  className="w-full border-white/[0.12] text-gray-300 hover:bg-white/[0.03] hover:text-white h-12 cursor-pointer transition-all duration-300 hover:border-violet-400/30 hover:shadow-lg hover:shadow-violet-500/10"
                >
                  <Link href="/">
                    <FaArrowLeft className="mr-3" />
                    Back to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact us on X:{" "}
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
};

const AuthErrorPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorPageContent />
    </Suspense>
  );
};

export default AuthErrorPage;
