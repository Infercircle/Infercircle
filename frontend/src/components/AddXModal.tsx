import Button from "./Button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signIn } from "next-auth/react";

import { FaXTwitter } from "react-icons/fa6";
import { FaGoogle } from "react-icons/fa6";

interface AddXModalProps {
  onClose: (value: boolean) => void;
  isGoogle: boolean;
}

export function AddXModal({ onClose, isGoogle }: AddXModalProps) {
  return (
    <div className="relative">
      <Card className="w-full max-w-md bg-[#181c20] border border-[#23272b] shadow-2xl min-w-96">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#A259FF]/10 rounded-full flex items-center justify-center">
              {isGoogle ? <FaGoogle className="text-2xl text-[#A259FF]" /> : <FaXTwitter className="text-2xl text-[#A259FF]" />}
            </div>
          </div>
          <CardTitle className="text-white text-lg font-semibold">Connect Your {isGoogle ? 'Google' : 'X'} Account</CardTitle>
          {!isGoogle ? (
            <CardDescription className="text-gray-400 text-sm leading-relaxed">
              Connect your Google account to unlock advanced analytics and personalized insights from the crypto Twitter ecosystem.
            </CardDescription>
          ) : (
            <CardDescription className="text-gray-400 text-sm leading-relaxed">
              Connect your Google account. To be able to login with your google account too.
            </CardDescription>
          )}
        </CardHeader>
        <CardFooter className="flex-col gap-3 px-10 pb-6">
          {!isGoogle ? (
            <Button variant="filled" className="w-full bg-[#A259FF] hover:bg-[#8B4DFF] text-white font-medium" onClick={() => {
              signIn("twitter", { callbackUrl: "/dashboard" })
            }}>
              Connect X Account
            </Button>):(
            <Button variant="filled" className="w-full bg-[#A259FF] hover:bg-[#8B4DFF] text-white font-medium" onClick={() => {
              console.log("Connecting Google Account");
              signIn("google", { callbackUrl: "/dashboard" })
            }}>
              Connect Google Account
            </Button>
          )}
          <CardAction className="text-center text-gray-400 text-sm w-full cursor-pointer" onClick={()=>{onClose(false)}}>Close</CardAction>
        </CardFooter>
      </Card>
    </div>
  )
}
