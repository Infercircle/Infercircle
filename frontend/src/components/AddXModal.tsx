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

export function AddXModal() {
  return (
    <div className="relative">
      <Card className="w-full max-w-md bg-[#181c20] border border-[#23272b] shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#A259FF]/10 rounded-full flex items-center justify-center">
              <FaXTwitter className="text-3xl text-[#A259FF]" />
            </div>
          </div>
          <CardTitle className="text-white text-xl font-semibold">Connect Your X Account</CardTitle>
          <CardDescription className="text-gray-400 text-sm leading-relaxed">
            Connect your X (Twitter) account to unlock advanced analytics and personalized insights from the crypto Twitter ecosystem.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col gap-3 px-10 pb-6">
          <Button variant="filled" className="w-full bg-[#A259FF] hover:bg-[#8B4DFF] text-white font-medium" onClick={() => {
            signIn("twitter", { callbackUrl: "/dashboard" })
          }}>
            Connect X Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
