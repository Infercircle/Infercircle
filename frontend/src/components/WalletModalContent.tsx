import React, { useState } from "react";
import { FiEdit2, FiEye, FiEyeOff } from "react-icons/fi";
import { FaWallet } from "react-icons/fa";
import { useToast } from "@/components/ToastProvider";

// Helper to mask addresses: first 5 + ... + last 4
function maskAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 5)}****************${addr.slice(-4)}`;
}

const WalletModalContent: React.FC = () => {
  const [ethAddress, setEthAddress] = useState("0xbdcd7a1Af7D81a5cD974868BF3467A745fBb9380");
  const [solAddress, setSolAddress] = useState("Hp6tWEk2G7q4F8s9d3kL");
  const [ethMasked, setEthMasked] = useState(true);
  const [solMasked, setSolMasked] = useState(true);
  const [editingEth, setEditingEth] = useState(false);
  const [editingSol, setEditingSol] = useState(false);
  const { showToast } = useToast();

  const handleEthConfirm = () => {
    setEditingEth(false);
    showToast("Ethereum address saved!", "success");
  };
  const handleSolConfirm = () => {
    setEditingSol(false);
    showToast("Solana address saved!", "success");
  };

  return (
    <div className="w-full max-w-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <FaWallet className="text-2xl" />
        My Wallets
      </h2>
      {/* No tabs, just inputted wallets */}
      {/* Wallet Inputs */}
      <div className="space-y-5">
        {/* Ethereum Wallet */}
        <div className="border border-[#23272b] rounded-xl p-4 bg-[#181A20]">
          <div className="text-gray-400 text-sm mb-2">Ethereum wallet</div>
          <div className="flex items-center gap-2">
            {editingEth ? (
              <>
                <div className="w-full max-w-[400px]">
                  <input
                    type="text"
                    value={ethAddress}
                    onChange={e => setEthAddress(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm"
                    spellCheck={false}
                    autoFocus
                  />
                </div>
                <button
                  className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer"
                  onClick={handleEthConfirm}
                >
                  Confirm
                </button>
              </>
            ) : (
              <>
                <div className="w-full max-w-[400px]">
                  <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                    {ethMasked ? maskAddress(ethAddress) : ethAddress}
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-white p-2 cursor-pointer"
                  onClick={() => setEthMasked(m => !m)}
                  aria-label={ethMasked ? "Show" : "Hide"}
                >
                  {ethMasked ? <FiEyeOff /> : <FiEye />}
                </button>
                <button
                  className="text-gray-400 hover:text-white p-2 cursor-pointer"
                  onClick={() => setEditingEth(true)}
                  aria-label="Edit"
                >
                  <FiEdit2 />
                </button>
              </>
            )}
          </div>
        </div>
        {/* Solana Wallet */}
        <div className="border border-[#23272b] rounded-xl p-4 bg-[#181A20]">
          <div className="text-gray-400 text-sm mb-2">Solana wallet</div>
          <div className="flex items-center gap-2">
            {editingSol ? (
              <>
                <div className="w-full max-w-[400px]">
                  <input
                    type="text"
                    value={solAddress}
                    onChange={e => setSolAddress(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm"
                    spellCheck={false}
                    autoFocus
                  />
                </div>
                <button
                  className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer"
                  onClick={handleSolConfirm}
                >
                  Confirm
                </button>
              </>
            ) : (
              <>
                <div className="w-full max-w-[400px]">
                  <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                    {solMasked ? maskAddress(solAddress) : solAddress}
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-white p-2 cursor-pointer"
                  onClick={() => setSolMasked(m => !m)}
                  aria-label={solMasked ? "Show" : "Hide"}
                >
                  {solMasked ? <FiEyeOff /> : <FiEye />}
                </button>
                <button
                  className="text-gray-400 hover:text-white p-2 cursor-pointer"
                  onClick={() => setEditingSol(true)}
                  aria-label="Edit"
                >
                  <FiEdit2 />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModalContent; 