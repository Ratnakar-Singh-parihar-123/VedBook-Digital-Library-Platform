import { Menu } from "lucide-react";
import logo from "../../assets/logo/mainLogo.png";

export default function AdminTopBar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 lg:hidden bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-haspopup="dialog"
          className="grid text-gray-600 transition rounded-lg w-9 h-9 place-items-center hover:bg-gray-100 active:bg-gray-100 shrink-0"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center min-w-0 gap-2">
          <div className="relative grid w-8 h-8 overflow-hidden bg-gray-900 rounded-lg place-items-center shrink-0">
            <img
              src={logo}
              alt=""
              className="object-contain w-full h-full "
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "grid";
              }}
            />
            <span className="absolute inset-0 hidden text-xs font-bold text-white place-items-center">
              V
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">
            VedBook
          </p>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-9 shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
}
