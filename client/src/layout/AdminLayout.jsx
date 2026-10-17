import { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../admin/components/AdminSideBar";
import Topbar from "../admin/components/AdminTopBar";
import Loader from "../components/ui/Loader";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Suspense
            fallback={
              <div className="min-h-[60vh] flex items-center justify-center">
                <Loader size={32} tone="dark" label="Loading" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
