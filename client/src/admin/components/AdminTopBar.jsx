import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  ExternalLink,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { resolveAvatarUrl } from "../../utils/urlUtils";

export default function AdminTopBar({ onMenuClick }) {
  const location = useLocation();
  const [admin, setAdmin] = useState({});
  const [imgBroken, setImgBroken] = useState(false);

  const readAdmin = () => {
    try {
      const raw = localStorage.getItem("ved_admin");
      setAdmin(raw ? JSON.parse(raw) : {});
    } catch {
      setAdmin({});
    }
  };

  useEffect(() => {
    readAdmin();
    window.addEventListener("ved-auth-change", readAdmin);
    return () => window.removeEventListener("ved-auth-change", readAdmin);
  }, []);

  const adminName = admin.name || admin.email || "Admin";
  const avatarUrl = resolveAvatarUrl(admin.profile_pic || admin.avatar);
  const initial = (adminName.charAt(0) || "A").toUpperCase();

  // Determine current page section title
  const path = location.pathname;
  let sectionTitle = "Console";
  if (path.includes("/books/upload")) sectionTitle = "Upload New Book";
  else if (path.includes("/books/edit")) sectionTitle = "Edit Book";
  else if (path.includes("/books")) sectionTitle = "All Books";
  else if (path.includes("/categories")) sectionTitle = "Categories";
  else if (path.includes("/users")) sectionTitle = "User Management";
  else if (path.includes("/featured")) sectionTitle = "Featured Masterpieces";
  else if (path.includes("/popular")) sectionTitle = "Popular This Week";
  else if (path.includes("/reviews")) sectionTitle = "Reviews";
  else if (path.includes("/analytics")) sectionTitle = "Analytics";
  else if (path.includes("/reading-activity")) sectionTitle = "Reading Activity";
  else if (path.includes("/activity-log")) sectionTitle = "Activity Log";
  else if (path.includes("/notifications")) sectionTitle = "Notifications";
  else if (path.includes("/settings")) sectionTitle = "Settings";
  else if (path.includes("/profile")) sectionTitle = "My Profile";
  else if (path.includes("/dashboard")) sectionTitle = "Dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-primary/10 bg-cream/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
        {/* Left: Mobile hamburger + section title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar menu"
            className="lg:hidden grid text-primary transition rounded-xl w-9 h-9 place-items-center bg-white border border-primary/10 hover:bg-mint shrink-0 shadow-soft"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gold">
              <ShieldCheck size={13} />
              Admin
            </span>
            <span className="hidden sm:inline text-primary/30">/</span>
            <h1 className="text-sm sm:text-base font-bold font-display text-primary truncate">
              {sectionTitle}
            </h1>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open public library in new tab"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-primary/10 text-xs font-semibold text-primary/80 hover:bg-mint hover:text-primary transition shadow-soft"
          >
            <span>Public Site</span>
            <ExternalLink size={12} className="text-gold" />
          </Link>

          <Link
            to="/admin/notifications"
            title="Notifications"
            className="relative grid w-9 h-9 place-items-center rounded-xl bg-white border border-primary/10 text-primary/70 hover:bg-mint hover:text-primary transition shadow-soft"
          >
            <Bell size={15} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold ring-2 ring-white" />
          </Link>

          <Link
            to="/admin/profile"
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-white border border-primary/10 hover:bg-mint transition shadow-soft group"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-primary text-gold font-display text-xs font-bold grid place-items-center shrink-0 ring-1 ring-gold/30">
              {avatarUrl && !imgBroken ? (
                <img
                  src={avatarUrl}
                  alt=""
                  onError={() => setImgBroken(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-primary group-hover:text-primary-light max-w-[100px] truncate">
              {adminName}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
