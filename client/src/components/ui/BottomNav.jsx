import { Home, Library, Search, User } from "lucide-react";

const tabs = [
  { key: "home", icon: Home, label: "Home" },
  { key: "library", icon: Library, label: "Library" },
  { key: "search", icon: Search, label: "Search" },
  { key: "profile", icon: User, label: "Profile" },
];

export default function BottomNav({ active = "home" }) {
  return (
    <div className="absolute bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur border-t border-primary/10 flex items-center justify-around px-2">
      {tabs.map(({ key, icon: Icon, label }) => {
        const on = key === active;
        return (
          <button
            key={key}
            className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
          >
            <Icon
              size={20}
              className={on ? "text-primary" : "text-primary/40"}
            />
            <span
              className={`text-[10px] ${on ? "text-primary font-medium" : "text-primary/40"}`}
            >
              {label}
            </span>
            {on && (
              <span className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-gold" />
            )}
          </button>
        );
      })}
    </div>
  );
}
