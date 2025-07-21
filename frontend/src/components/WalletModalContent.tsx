import React, { useState } from "react";
import { FiEdit2, FiEye, FiEyeOff } from "react-icons/fi";
import { FaWallet } from "react-icons/fa";
import { useToast } from "@/components/ToastProvider";

// Helper to mask addresses: first 5 + ... + last 4
function maskAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 5)}****************${addr.slice(-4)}`;
}

interface WalletModalContentProps {
  eth: string;
  sol: string;
  setWallets: React.Dispatch<React.SetStateAction<{ eth: string; sol: string }>>;
}

const WalletModalContent: React.FC<WalletModalContentProps> = ({ eth, sol, setWallets }) => {
  const [ethAddress, setEthAddress] = useState(eth);
  const [solAddress, setSolAddress] = useState(sol);
  const [ethMasked, setEthMasked] = useState(true);
  const [solMasked, setSolMasked] = useState(true);
  const [editingEth, setEditingEth] = useState(false);
  const [editingSol, setEditingSol] = useState(false);
  const { showToast } = useToast();

  const handleEthConfirm = () => {
    setEditingEth(false);
    setWallets(prev => ({ ...prev, eth: ethAddress.trim() }));
    showToast("Ethereum address saved!", "success");
  };
  const handleSolConfirm = () => {
    setEditingSol(false);
    setWallets(prev => ({ ...prev, sol: solAddress.trim() }));
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
                  <textarea
                    value={ethAddress}
                    onChange={e => setEthAddress(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button
                  className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer"
                  onClick={handleEthConfirm}
                >
                  Confirm
                </button>
              </>
            ) : eth ? (
              <>
                <div className="w-full max-w-[400px]">
                  <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                    {ethMasked ? maskAddress(eth) : eth}
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
                  onClick={() => { setEditingEth(true); setEthAddress(eth); }}
                  aria-label="Edit"
                >
                  <FiEdit2 />
                </button>
              </>
            ) : (
              <div className="w-full max-w-[400px]">
                <div
                  className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer"
                  onClick={() => { setEditingEth(true); setEthAddress(""); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Add Ethereum address"
                >
                  <span className="text-gray-500">Input Ethereum address</span>
                </div>
              </div>
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
                  <textarea
                    value={solAddress}
                    onChange={e => setSolAddress(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button
                  className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer"
                  onClick={handleSolConfirm}
                >
                  Confirm
                </button>
              </>
            ) : sol ? (
              <>
                <div className="w-full max-w-[400px]">
                  <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                    {solMasked ? maskAddress(sol) : sol}
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
                  onClick={() => { setEditingSol(true); setSolAddress(sol); }}
                  aria-label="Edit"
                >
                  <FiEdit2 />
                </button>
              </>
            ) : (
              <div className="w-full max-w-[400px]">
                <div
                  className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer"
                  onClick={() => { setEditingSol(true); setSolAddress(""); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Add Solana address"
                >
                  <span className="text-gray-500">Input Solana address</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModalContent; 