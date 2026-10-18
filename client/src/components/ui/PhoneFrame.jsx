export default function PhoneFrame({ children, time = "9:41" }) {
  return (
    <div className="relative animate-float">
      {/* glow */}
      <div className="absolute rounded-full -inset-8 bg-gradient-to-tr from-gold/30 via-transparent to-primary/20 blur-3xl opacity-70" />

      {/* outer body */}
      <div className="relative w-[300px] h-[620px] rounded-[3rem] bg-primary p-2 shadow-[0_30px_60px_-20px_rgba(23,63,53,0.5)]">
        {/* side buttons */}
        <div className="absolute w-1 h-12 -left-1 top-32 bg-gold/70 rounded-l-md" />
        <div className="absolute w-1 h-16 -left-1 top-48 bg-gold/70 rounded-l-md" />
        <div className="absolute w-1 h-20 -right-1 top-40 bg-gold/70 rounded-r-md" />

        {/* screen */}
        <div className="relative w-full h-full rounded-[2.5rem] bg-cream overflow-hidden">
          {/* dynamic island */}
          <div className="absolute z-20 w-24 h-6 -translate-x-1/2 rounded-full top-2 left-1/2 bg-primary" />

          {/* status bar */}
          <div className="absolute top-0 inset-x-0 h-10 px-6 flex items-center justify-between text-[11px] font-medium text-primary z-10">
            <span>{time}</span>
            <div className="flex items-center gap-1.5">
              <span className="relative w-4 h-3 border rounded-sm border-primary/60">
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
