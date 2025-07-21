import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60
"
      onClick={onClose} // Handle outside click here
    >
      <div
        className="bg-[#181A20] rounded-2xl p-6 shadow-xl relative w-full max-w-[550px] max-w-[90vw] w-full mx-4 border border-[#23272b]"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl font-bold"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
 