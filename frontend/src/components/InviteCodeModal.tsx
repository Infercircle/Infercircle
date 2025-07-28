import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useRouter } from 'next/navigation';

import { FaLock } from "react-icons/fa6";
import { useSession } from "next-auth/react";
import { User } from "@prisma/client";
import { useState } from "react";
interface InviteCodeModalProps {
    inviteCode: string;
    setInviteCode: (code: string) => void;
}
export function InviteCodeModal({ inviteCode, setInviteCode }: InviteCodeModalProps) {
  const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

  const handleSubmit = async() => {
    setLoading(true);
    console.log("Invite Code: ", inviteCode);
    // Handle invite code submission
    const code = await fetch("/api/invite-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: inviteCode }),
    });
    const response = await code.json();
    console.log("Invite Code Response: ", response);
    if (response.error) {
      alert(response.error || "An error occurred while processing the invite code.");
      return;
    }
    console.log("Invite Code Response: ", response);
    const usr = session?.user as User;
    if (usr.username && usr.username.length > 0) {
        router.push('/dashboard');
    }else {
        router.push('/dashboard?addX=true');
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <Card className="w-full max-w-md bg-[#181c20] border border-[#23272b] shadow-2xl min-w-96">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#A259FF]/10 rounded-full flex items-center justify-center">
              <FaLock className="absolute text-2xl text-gray-300" />
            </div>
          </div>
          <CardTitle className="text-white text-xl">Hii {session?.user.name}!</CardTitle>
          <CardDescription className="text-gray-400 text-sm leading-relaxed">
            {"We are in beta, please enter your invite code to access the platform. If you don't have one, please contact support."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col gap-3 px-10 pb-6">
          <Input placeholder="Enter your invite code" onChange={(e) => setInviteCode(e.target.value)} />
          <Button 
            className="w-full bg-[#A259FF] hover:bg-[#8B4DFF] text-white font-medium" 
            onClick={()=>{handleSubmit()}}
            disabled={loading}
          >
            Submit
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
