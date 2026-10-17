import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Library,
  Upload,
  FolderTree,
  Users,
  TrendingUp,
  BookMarked,
  History,
  Settings,
  X,
  LogOut,
  User,
  ChevronRight,
  ShieldCheck,
  Bell,
  Star,
  Flame,
  MessageSquare,
} from "lucide-react";
import logo from "../../assets/logo/mainLogo.png";

/* ------------------------------------------------------------------ */
/*  Nav groups                                                         */
/* ------------------------------------------------------------------ */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        to: "/admin/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/books", label: "All Books", icon: Library },
      { to: "/admin/books/upload", label: "Upload Book", icon: Upload },
      { to: "/admin/categories", label: "Categories", icon: FolderTree },
      { to: "/admin/featured", label: "Featured Masterpieces", icon: Star },
      // { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
      { to: "/admin/popular", label: "Popular This Week", icon: Flame },
      { to: "/admin/reviews", label: "Review Management", icon: MessageSquare },
    ],
  },
  {
    label: "Community",
    items: [{ to: "/admin/users", label: "Users", icon: Users }],
  },
  {
    label: "Insights",
    items: [
      { to: "/admin/analytics", label: "Analytics & Trends", icon: TrendingUp },
      {
        to: "/admin/reading-activity",
        label: "Reading Activity",
        icon: BookMarked,
      },
      { to: "/admin/activity-log", label: "Admin Activity Log", icon: History },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/profile", label: "Profile", icon: User },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

import { resolveAvatarUrl } from "../../utils/urlUtils";


function getAvatarFromAdmin(admin) {
  if (!admin) return "";
  const raw =
    admin.profile_pic ||
    admin.profilePic ||
    admin.avatar ||
    admin.profileImage ||
    admin.image ||
    admin.photo ||
    "";
  return resolveAvatarUrl(raw);
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
export default function AdminSideBar({ open, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  /* Admin info — re-read when drawer opens */
  const [admin, setAdmin] = useState({});
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("ved_admin") || "{}");
      setAdmin(parsed || {});
    } catch {
      setAdmin({});
    }
  }, [open]);

  const adminName = admin.name || admin.email || "Admin";
  const adminEmail = admin.email || "Signed in";
  const adminInitial = (adminName.charAt(0) || "A").toUpperCase();
  const avatarUrl = getAvatarFromAdmin(admin);
  const [avatarBroken, setAvatarBroken] = useState(false);

  /* Body scroll lock on mobile */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Escape closes on mobile */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleLogout = () => {
    localStorage.removeItem("ved_token");
    localStorage.removeItem("ved_admin");
    navigate("/admin/login");
  };

  /* Nav link styles */
  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-primary text-cream shadow-soft"
        : "text-primary/70 hover:bg-mint hover:text-primary"
    }`;

  /* Shared content */
  const content = (
    <>
      {/* ============ BRAND ============ */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary/10 shrink-0">
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center gap-2.5 min-w-0 group"
          aria-label="VedBook Admin"
        >
          <div className="relative grid overflow-hidden place-items-center w-9 h-9 rounded-xl bg-primary ring-1 ring-primary/20 shrink-0">
            <img
              src={logo}
              alt="VedBook"
              className="object-contain w-full h-full "
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "grid";
              }}
            />
            <span className="absolute inset-0 hidden text-sm font-bold place-items-center font-display text-gold">
              V
            </span>
          </div>
          <div className="min-w-0 leading-none">
            <p className="text-base truncate font-display text-primary">
              VedBook
            </p>
            <p className="text-[10px] text-primary/50 uppercase tracking-wider mt-0.5">
              Admin
            </p>
          </div>
        </NavLink>

        {/* Close (mobile only) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="grid transition rounded-lg lg:hidden w-9 h-9 place-items-center text-primary/60 hover:bg-mint hover:text-primary shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* ============ NAV ============ */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 px-3 py-4 space-y-5 overflow-y-auto sidebar-scroll"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={linkClass}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Left accent bar when active */}
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-gold transition-all duration-300 ${
                            isActive ? "h-5 opacity-100" : "h-0 opacity-0"
                          }`}
                        />

                        {/* Icon tile */}
                        <span
                          className={`grid w-7 h-7 rounded-lg place-items-center shrink-0 transition-colors ${
                            isActive
                              ? "bg-cream/15 text-cream"
                              : "bg-mint text-primary/70 group-hover:bg-gold/30 group-hover:text-primary"
                          }`}
                        >
                          <Icon size={14} />
                        </span>

                        <span className="flex-1 truncate">{label}</span>

                        <ChevronRight
                          size={13}
                          className={`shrink-0 transition-all duration-200 ${
                            isActive
                              ? "text-cream"
                              : "text-primary/25 group-hover:text-primary/70 group-hover:translate-x-0.5"
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ============ FOOTER — user + profile image ============ */}
      <div className="p-3 border-t border-primary/10 shrink-0">
        {/* Profile card (clickable → goes to profile) */}
        <NavLink
          to="/admin/profile"
          onClick={onClose}
          className="group flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-mint/50 hover:bg-mint border border-primary/5 transition-all"
        >
          {/* Avatar image with fallback */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 overflow-hidden rounded-full bg-primary ring-2 ring-gold/40 ring-offset-2 ring-offset-cream">
              {avatarUrl && !avatarBroken ? (
                <img
                  src={avatarUrl}
                  alt={adminName}
                  className="object-cover w-full h-full"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <div className="grid w-full h-full text-sm font-bold place-items-center font-display text-gold">
                  {adminInitial}
                </div>
              )}
            </div>
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-cream" />
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold truncate text-primary">
                {adminName}
              </p>
              <ShieldCheck size={11} className="text-gold shrink-0" />
            </div>
            <p className="text-[10px] text-primary/50 truncate mt-0.5">
              {adminEmail}
            </p>
          </div>

          <ChevronRight
            size={13}
            className="text-primary/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </NavLink>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary/70 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <span className="grid transition-colors rounded-lg w-7 h-7 bg-mint place-items-center shrink-0 group-hover:bg-red-100">
            <LogOut size={14} />
          </span>
          <span className="flex-1 text-left">Log out</span>
        </button>

        <p className="text-center text-[10px] text-primary/30 pt-2">
          © {new Date().getFullYear()} VedBook
        </p>
      </div>

      {/* Scrollbar styling */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(23, 63, 53, 0.15);
          border-radius: 999px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(23, 63, 53, 0.3);
        }
      `}</style>
    </>
  );

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile drawer */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className={`lg:hidden fixed top-0 left-0 z-50 h-[100dvh] w-[86%] max-w-[320px]
          bg-cream flex flex-col overflow-hidden
          transition-transform duration-300 ease-out will-change-transform
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="relative flex flex-col h-full">{content}</div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed top-0 left-0 z-30 flex-col hidden w-64 h-screen border-r bg-cream border-primary/10 lg:flex">
        <div className="relative flex flex-col h-full">{content}</div>
      </aside>
    </>
  );
}
