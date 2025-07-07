const Suggested = () => {
  return (
    <div className="bg-[#181A20] border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-white">Suggested for you</div>
      </div>
      <div className="flex-1 flex items-center justify-center text-[#A3A3A3] text-sm">
        Suggestions will appear here.
      </div>
    </div>
  );
};

export default Suggested;
