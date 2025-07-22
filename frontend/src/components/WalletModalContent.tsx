import React, { useState } from "react";
import { FiEdit2, FiEye, FiEyeOff, FiPlus, FiTrash2 } from "react-icons/fi";
import { FaWallet } from "react-icons/fa";
import { useToast } from "@/components/ToastProvider";

// Helper to mask addresses: first 5 + ... + last 4
function maskAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 5)}****************${addr.slice(-4)}`;
}

interface WalletModalContentProps {
  eth: string[];
  sol: string[];
  btc: string[];
  tron: string[];
  ton: string[];
  doge: string[];
  setWallets: React.Dispatch<React.SetStateAction<{
    eth: string[];
    sol: string[];
    btc: string[];
    tron: string[];
    ton: string[];
    doge: string[];
  }>>;
}

const WalletModalContent: React.FC<WalletModalContentProps> = ({ eth, sol, btc, tron, ton, doge, setWallets }) => {
  const [newEth, setNewEth] = useState("");
  const [newSol, setNewSol] = useState("");
  const [addingEth, setAddingEth] = useState(false);
  const [addingSol, setAddingSol] = useState(false);
  const [editEthIdx, setEditEthIdx] = useState<number|null>(null);
  const [editSolIdx, setEditSolIdx] = useState<number|null>(null);
  const [editEthValue, setEditEthValue] = useState("");
  const [editSolValue, setEditSolValue] = useState("");
  const [maskedEth, setMaskedEth] = useState<{[k:number]: boolean}>({});
  const [maskedSol, setMaskedSol] = useState<{[k:number]: boolean}>({});
  const { showToast } = useToast();

  // For each wallet type, manage add/edit/mask state
  const [newBtc, setNewBtc] = useState("");
  const [addingBtc, setAddingBtc] = useState(false);
  const [editBtcIdx, setEditBtcIdx] = useState<number|null>(null);
  const [editBtcValue, setEditBtcValue] = useState("");
  const [maskedBtc, setMaskedBtc] = useState<{[k:number]: boolean}>({});

  const [newTron, setNewTron] = useState("");
  const [addingTron, setAddingTron] = useState(false);
  const [editTronIdx, setEditTronIdx] = useState<number|null>(null);
  const [editTronValue, setEditTronValue] = useState("");
  const [maskedTron, setMaskedTron] = useState<{[k:number]: boolean}>({});

  const [newTon, setNewTon] = useState("");
  const [addingTon, setAddingTon] = useState(false);
  const [editTonIdx, setEditTonIdx] = useState<number|null>(null);
  const [editTonValue, setEditTonValue] = useState("");
  const [maskedTon, setMaskedTon] = useState<{[k:number]: boolean}>({});

  const [newDoge, setNewDoge] = useState("");
  const [addingDoge, setAddingDoge] = useState(false);
  const [editDogeIdx, setEditDogeIdx] = useState<number|null>(null);
  const [editDogeValue, setEditDogeValue] = useState("");
  const [maskedDoge, setMaskedDoge] = useState<{[k:number]: boolean}>({});

  // Add new eth address
  const handleEthConfirm = () => {
    if (newEth.trim() && !eth.includes(newEth.trim())) {
      setWallets(prev => ({ ...prev, eth: [...prev.eth, newEth.trim()] }));
      showToast("Ethereum address added!", "success");
    }
    setNewEth("");
    setAddingEth(false);
  };
  // Add new sol address
  const handleSolConfirm = () => {
    if (newSol.trim() && !sol.includes(newSol.trim())) {
      setWallets(prev => ({ ...prev, sol: [...prev.sol, newSol.trim()] }));
      showToast("Solana address added!", "success");
    }
    setNewSol("");
    setAddingSol(false);
  };
  // Edit eth address
  const handleEthEditConfirm = (idx: number) => {
    if (editEthValue.trim()) {
      setWallets(prev => ({ ...prev, eth: prev.eth.map((a, i) => i === idx ? editEthValue.trim() : a) }));
      showToast("Ethereum address updated!", "success");
    }
    setEditEthIdx(null);
    setEditEthValue("");
  };
  // Edit sol address
  const handleSolEditConfirm = (idx: number) => {
    if (editSolValue.trim()) {
      setWallets(prev => ({ ...prev, sol: prev.sol.map((a, i) => i === idx ? editSolValue.trim() : a) }));
      showToast("Solana address updated!", "success");
    }
    setEditSolIdx(null);
    setEditSolValue("");
  };
  // Remove eth address
  const handleEthRemove = (idx: number) => {
    setWallets(prev => ({ ...prev, eth: prev.eth.filter((_, i) => i !== idx) }));
    showToast("Ethereum address removed!", "success");
  };
  // Remove sol address
  const handleSolRemove = (idx: number) => {
    setWallets(prev => ({ ...prev, sol: prev.sol.filter((_, i) => i !== idx) }));
    showToast("Solana address removed!", "success");
  };

  // Add/edit/remove logic for each wallet type
  const handleBtcConfirm = () => {
    if (newBtc.trim() && !btc.includes(newBtc.trim())) {
      setWallets(prev => ({ ...prev, btc: [...prev.btc, newBtc.trim()] }));
      showToast("Bitcoin address added!", "success");
    }
    setNewBtc("");
    setAddingBtc(false);
  };
  const handleBtcEditConfirm = (idx: number) => {
    if (editBtcValue.trim()) {
      setWallets(prev => ({ ...prev, btc: prev.btc.map((a, i) => i === idx ? editBtcValue.trim() : a) }));
      showToast("Bitcoin address updated!", "success");
    }
    setEditBtcIdx(null);
    setEditBtcValue("");
  };
  const handleBtcRemove = (idx: number) => {
    setWallets(prev => ({ ...prev, btc: prev.btc.filter((_, i) => i !== idx) }));
    showToast("Bitcoin address removed!", "success");
  };

  const handleTronConfirm = () => {
    if (newTron.trim() && !tron.includes(newTron.trim())) {
      setWallets(prev => ({ ...prev, tron: [...prev.tron, newTron.trim()] }));
      showToast("TRON address added!", "success");
    }
    setNewTron("");
    setAddingTron(false);
  };
  const handleTronEditConfirm = (idx: number) => {
    if (editTronValue.trim()) {
      setWallets(prev => ({ ...prev, tron: prev.tron.map((a, i) => i === idx ? editTronValue.trim() : a) }));
      showToast("TRON address updated!", "success");
    }
    setEditTronIdx(null);
    setEditTronValue("");
  };
  const handleTronRemove = (idx: number) => {
    setWallets(prev => ({ ...prev, tron: prev.tron.filter((_, i) => i !== idx) }));
    showToast("TRON address removed!", "success");
  };

  const handleTonConfirm = () => {
    if (newTon.trim() && !ton.includes(newTon.trim())) {
      setWallets(prev => ({ ...prev, ton: [...prev.ton, newTon.trim()] }));
      showToast("TON address added!", "success");
    }
    setNewTon("");
    setAddingTon(false);
  };
  const handleTonEditConfirm = (idx: number) => {
    if (editTonValue.trim()) {
      setWallets(prev => ({ ...prev, ton: prev.ton.map((a, i) => i === idx ? editTonValue.trim() : a) }));
      showToast("TON address updated!", "success");
    }
    setEditTonIdx(null);
    setEditTonValue("");
  };
  const handleTonRemove = (idx: number) => {
    setWallets(prev => ({ ...prev, ton: prev.ton.filter((_, i) => i !== idx) }));
    showToast("TON address removed!", "success");
  };

  const handleDogeConfirm = () => {
    if (newDoge.trim() && !doge.includes(newDoge.trim())) {
      setWallets(prev => ({ ...prev, doge: [...prev.doge, newDoge.trim()] }));
      showToast("Dogecoin address added!", "success");
    }
    setNewDoge("");
    setAddingDoge(false);
  };
  const handleDogeEditConfirm = (idx: number) => {
    if (editDogeValue.trim()) {
      setWallets(prev => ({ ...prev, doge: prev.doge.map((a, i) => i === idx ? editDogeValue.trim() : a) }));
      showToast("Dogecoin address updated!", "success");
    }
    setEditDogeIdx(null);
    setEditDogeValue("");
  };
  const handleDogeRemove = (idx: number) => {
    setWallets(prev => ({ ...prev, doge: prev.doge.filter((_, i) => i !== idx) }));
    showToast("Dogecoin address removed!", "success");
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
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-sm">Ethereum wallet</span>
            <button className="ml-1 p-1 rounded hover:bg-[#23272b] cursor-pointer" onClick={() => setAddingEth(true)} aria-label="Add Ethereum address">
              <FiPlus className="text-lg text-[#A259FF]" />
            </button>
          </div>
          {/* List all eth addresses */}
          <div className="space-y-2">
            {eth.map((address, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editEthIdx === idx ? (
                  <>
                    <div className="w-full max-w-[400px]">
                      <textarea
                        value={editEthValue}
                        onChange={e => setEditEthValue(e.target.value)}
                        className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                        spellCheck={false}
                        autoFocus
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '90px' }}
                      />
                    </div>
                    <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={() => handleEthEditConfirm(idx)}>Confirm</button>
                  </>
                ) : (
                  <>
                    <div className="w-full max-w-[400px]">
                      <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                        {maskedEth[idx] !== false ? maskAddress(address) : address}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => setMaskedEth(m => ({ ...m, [idx]: !m[idx] }))} aria-label={maskedEth[idx] !== false ? "Show" : "Hide"}>{maskedEth[idx] !== false ? <FiEyeOff /> : <FiEye />}</button>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => { setEditEthIdx(idx); setEditEthValue(address); }} aria-label="Edit"><FiEdit2 /></button>
                    <button className="text-gray-400 hover:text-red-400 p-2 cursor-pointer" onClick={() => handleEthRemove(idx)} aria-label="Remove"><FiTrash2 /></button>
                  </>
                )}
              </div>
            ))}
            {/* Add new eth address */}
            {addingEth && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full max-w-[400px]">
                  <textarea
                    value={newEth}
                    onChange={e => setNewEth(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={handleEthConfirm}>Confirm</button>
              </div>
            )}
            {eth.length === 0 && !addingEth && (
              <div className="w-full max-w-[400px]">
                <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer" onClick={() => setAddingEth(true)} tabIndex={0} role="button" aria-label="Add Ethereum address">
                  <span className="text-gray-500">Input Ethereum address</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Solana Wallet */}
        <div className="border border-[#23272b] rounded-xl p-4 bg-[#181A20]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-sm">Solana wallet</span>
            <button className="ml-1 p-1 rounded hover:bg-[#23272b] cursor-pointer" onClick={() => setAddingSol(true)} aria-label="Add Solana address">
              <FiPlus className="text-lg text-[#A259FF]" />
            </button>
          </div>
          {/* List all sol addresses */}
          <div className="space-y-2">
            {sol.map((address, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editSolIdx === idx ? (
                  <>
                    <div className="w-full max-w-[400px]">
                      <textarea
                        value={editSolValue}
                        onChange={e => setEditSolValue(e.target.value)}
                        className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                        spellCheck={false}
                        autoFocus
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '90px' }}
                      />
                    </div>
                    <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={() => handleSolEditConfirm(idx)}>Confirm</button>
                  </>
                ) : (
                  <>
                    <div className="w-full max-w-[400px]">
                      <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                        {maskedSol[idx] !== false ? maskAddress(address) : address}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => setMaskedSol(m => ({ ...m, [idx]: !m[idx] }))} aria-label={maskedSol[idx] !== false ? "Show" : "Hide"}>{maskedSol[idx] !== false ? <FiEyeOff /> : <FiEye />}</button>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => { setEditSolIdx(idx); setEditSolValue(address); }} aria-label="Edit"><FiEdit2 /></button>
                    <button className="text-gray-400 hover:text-red-400 p-2 cursor-pointer" onClick={() => handleSolRemove(idx)} aria-label="Remove"><FiTrash2 /></button>
                  </>
                )}
              </div>
            ))}
            {/* Add new sol address */}
            {addingSol && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full max-w-[400px]">
                  <textarea
                    value={newSol}
                    onChange={e => setNewSol(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={handleSolConfirm}>Confirm</button>
              </div>
            )}
            {sol.length === 0 && !addingSol && (
              <div className="w-full max-w-[400px]">
                <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer" onClick={() => setAddingSol(true)} tabIndex={0} role="button" aria-label="Add Solana address">
                  <span className="text-gray-500">Input Solana address</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bitcoin Wallet */}
        <div className="border border-[#23272b] rounded-xl p-4 bg-[#181A20]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-sm">Bitcoin wallet</span>
            <button className="ml-1 p-1 rounded hover:bg-[#23272b] cursor-pointer" onClick={() => setAddingBtc(true)} aria-label="Add Bitcoin address">
              <FiPlus className="text-lg text-[#A259FF]" />
            </button>
          </div>
          <div className="space-y-2">
            {btc.map((address, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editBtcIdx === idx ? (
                  <>
                    <div className="w-full max-w-[400px]">
                      <textarea
                        value={editBtcValue}
                        onChange={e => setEditBtcValue(e.target.value)}
                        className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                        spellCheck={false}
                        autoFocus
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '90px' }}
                      />
                    </div>
                    <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={() => handleBtcEditConfirm(idx)}>Confirm</button>
                  </>
                ) : (
                  <>
                    <div className="w-full max-w-[400px]">
                      <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                        {maskedBtc[idx] !== false ? maskAddress(address) : address}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => setMaskedBtc(m => ({ ...m, [idx]: !m[idx] }))} aria-label={maskedBtc[idx] !== false ? "Show" : "Hide"}>{maskedBtc[idx] !== false ? <FiEyeOff /> : <FiEye />}</button>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => { setEditBtcIdx(idx); setEditBtcValue(address); }} aria-label="Edit"><FiEdit2 /></button>
                    <button className="text-gray-400 hover:text-red-400 p-2 cursor-pointer" onClick={() => handleBtcRemove(idx)} aria-label="Remove"><FiTrash2 /></button>
                  </>
                )}
              </div>
            ))}
            {addingBtc && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full max-w-[400px]">
                  <textarea
                    value={newBtc}
                    onChange={e => setNewBtc(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={handleBtcConfirm}>Confirm</button>
              </div>
            )}
            {btc.length === 0 && !addingBtc && (
              <div className="w-full max-w-[400px]">
                <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer" onClick={() => setAddingBtc(true)} tabIndex={0} role="button" aria-label="Add Bitcoin address">
                  <span className="text-gray-500">Input Bitcoin address</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TRON Wallet */}
        <div className="border border-[#23272b] rounded-xl p-4 bg-[#181A20]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-sm">TRON wallet</span>
            <button className="ml-1 p-1 rounded hover:bg-[#23272b] cursor-pointer" onClick={() => setAddingTron(true)} aria-label="Add TRON address">
              <FiPlus className="text-lg text-[#A259FF]" />
            </button>
          </div>
          <div className="space-y-2">
            {tron.map((address, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editTronIdx === idx ? (
                  <>
                    <div className="w-full max-w-[400px]">
                      <textarea
                        value={editTronValue}
                        onChange={e => setEditTronValue(e.target.value)}
                        className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                        spellCheck={false}
                        autoFocus
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '90px' }}
                      />
                    </div>
                    <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={() => handleTronEditConfirm(idx)}>Confirm</button>
                  </>
                ) : (
                  <>
                    <div className="w-full max-w-[400px]">
                      <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                        {maskedTron[idx] !== false ? maskAddress(address) : address}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => setMaskedTron(m => ({ ...m, [idx]: !m[idx] }))} aria-label={maskedTron[idx] !== false ? "Show" : "Hide"}>{maskedTron[idx] !== false ? <FiEyeOff /> : <FiEye />}</button>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => { setEditTronIdx(idx); setEditTronValue(address); }} aria-label="Edit"><FiEdit2 /></button>
                    <button className="text-gray-400 hover:text-red-400 p-2 cursor-pointer" onClick={() => handleTronRemove(idx)} aria-label="Remove"><FiTrash2 /></button>
                  </>
                )}
              </div>
            ))}
            {addingTron && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full max-w-[400px]">
                  <textarea
                    value={newTron}
                    onChange={e => setNewTron(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={handleTronConfirm}>Confirm</button>
              </div>
            )}
            {tron.length === 0 && !addingTron && (
              <div className="w-full max-w-[400px]">
                <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer" onClick={() => setAddingTron(true)} tabIndex={0} role="button" aria-label="Add TRON address">
                  <span className="text-gray-500">Input TRON address</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TON Wallet */}
        <div className="border border-[#23272b] rounded-xl p-4 bg-[#181A20]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-sm">TON wallet</span>
            <button className="ml-1 p-1 rounded hover:bg-[#23272b] cursor-pointer" onClick={() => setAddingTon(true)} aria-label="Add TON address">
              <FiPlus className="text-lg text-[#A259FF]" />
            </button>
          </div>
          <div className="space-y-2">
            {ton.map((address, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editTonIdx === idx ? (
                  <>
                    <div className="w-full max-w-[400px]">
                      <textarea
                        value={editTonValue}
                        onChange={e => setEditTonValue(e.target.value)}
                        className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                        spellCheck={false}
                        autoFocus
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '90px' }}
                      />
                    </div>
                    <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={() => handleTonEditConfirm(idx)}>Confirm</button>
                  </>
                ) : (
                  <>
                    <div className="w-full max-w-[400px]">
                      <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                        {maskedTon[idx] !== false ? maskAddress(address) : address}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => setMaskedTon(m => ({ ...m, [idx]: !m[idx] }))} aria-label={maskedTon[idx] !== false ? "Show" : "Hide"}>{maskedTon[idx] !== false ? <FiEyeOff /> : <FiEye />}</button>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => { setEditTonIdx(idx); setEditTonValue(address); }} aria-label="Edit"><FiEdit2 /></button>
                    <button className="text-gray-400 hover:text-red-400 p-2 cursor-pointer" onClick={() => handleTonRemove(idx)} aria-label="Remove"><FiTrash2 /></button>
                  </>
                )}
              </div>
            ))}
            {addingTon && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full max-w-[400px]">
                  <textarea
                    value={newTon}
                    onChange={e => setNewTon(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={handleTonConfirm}>Confirm</button>
              </div>
            )}
            {ton.length === 0 && !addingTon && (
              <div className="w-full max-w-[400px]">
                <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer" onClick={() => setAddingTon(true)} tabIndex={0} role="button" aria-label="Add TON address">
                  <span className="text-gray-500">Input TON address</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dogecoin Wallet */}
        <div className="border border-[#23272b] rounded-xl p-4 bg-[#181A20]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-sm">Dogecoin wallet</span>
            <button className="ml-1 p-1 rounded hover:bg-[#23272b] cursor-pointer" onClick={() => setAddingDoge(true)} aria-label="Add Dogecoin address">
              <FiPlus className="text-lg text-[#A259FF]" />
            </button>
          </div>
          <div className="space-y-2">
            {doge.map((address, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editDogeIdx === idx ? (
                  <>
                    <div className="w-full max-w-[400px]">
                      <textarea
                        value={editDogeValue}
                        onChange={e => setEditDogeValue(e.target.value)}
                        className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                        spellCheck={false}
                        autoFocus
                        rows={1}
                        style={{ minHeight: '40px', maxHeight: '90px' }}
                      />
                    </div>
                    <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={() => handleDogeEditConfirm(idx)}>Confirm</button>
                  </>
                ) : (
                  <>
                    <div className="w-full max-w-[400px]">
                      <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center">
                        {maskedDoge[idx] !== false ? maskAddress(address) : address}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => setMaskedDoge(m => ({ ...m, [idx]: !m[idx] }))} aria-label={maskedDoge[idx] !== false ? "Show" : "Hide"}>{maskedDoge[idx] !== false ? <FiEyeOff /> : <FiEye />}</button>
                    <button className="text-gray-400 hover:text-white p-2 cursor-pointer" onClick={() => { setEditDogeIdx(idx); setEditDogeValue(address); }} aria-label="Edit"><FiEdit2 /></button>
                    <button className="text-gray-400 hover:text-red-400 p-2 cursor-pointer" onClick={() => handleDogeRemove(idx)} aria-label="Remove"><FiTrash2 /></button>
                  </>
                )}
              </div>
            ))}
            {addingDoge && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full max-w-[400px]">
                  <textarea
                    value={newDoge}
                    onChange={e => setNewDoge(e.target.value)}
                    className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] focus:outline-none text-sm resize-none"
                    spellCheck={false}
                    autoFocus
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '90px' }}
                  />
                </div>
                <button className="ml-2 px-4 py-2 bg-[#A259FF] text-white font-semibold rounded-lg text-sm hover:bg-[#a259ffcc] focus:outline-none cursor-pointer" onClick={handleDogeConfirm}>Confirm</button>
              </div>
            )}
            {doge.length === 0 && !addingDoge && (
              <div className="w-full max-w-[400px]">
                <div className="w-full bg-[#23272b] text-white px-3 py-2 rounded-lg border border-[#23272b] text-sm flex items-center cursor-pointer" onClick={() => setAddingDoge(true)} tabIndex={0} role="button" aria-label="Add Dogecoin address">
                  <span className="text-gray-500">Input Dogecoin address</span>
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