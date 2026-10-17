export default function PhoneFrame({ children, time = "9:41" }) {
  return (
    <div className="relative animate-float">
      {/* glow */}
      <div className="absolute -inset-8 bg-gradient-to-tr from-gold/30 via-transparent to-primary/20 blur-3xl rounded-full opacity-70" />

      {/* outer body */}
      <div className="relative w-[300px] h-[620px] rounded-[3rem] bg-primary p-2 shadow-[0_30px_60px_-20px_rgba(23,63,53,0.5)]">
        {/* side buttons */}
        <div className="absolute -left-1 top-32 w-1 h-12 bg-gold/70 rounded-l-md" />
        <div className="absolute -left-1 top-48 w-1 h-16 bg-gold/70 rounded-l-md" />
        <div className="absolute -right-1 top-40 w-1 h-20 bg-gold/70 rounded-r-md" />

        {/* screen */}
        <div className="relative w-full h-full rounded-[2.5rem] bg-cream overflow-hidden">
          {/* dynamic island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-primary rounded-full z-20" />

          {/* status bar */}
          <div className="absolute top-0 inset-x-0 h-10 px-6 flex items-center justify-between text-[11px] font-medium text-primary z-10">
            <span>{time}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded-sm border border-primary/60 relative">
                <span className="absolute inset-0.5 bg-primary rounded-[1px]" />
              </span>
              <span className="text-[10px]">5G</span>
            </div>
          </div>

          {/* content */}
          <div className="absolute inset-0 pt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
