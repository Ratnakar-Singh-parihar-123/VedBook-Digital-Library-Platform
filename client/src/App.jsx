import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer.jsx";
import ScrollToTop from "./components/ui/ScrollToTop.jsx";
import Loader from "./components/ui/Loader";

import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminLayout from "./layout/AdminLayout.jsx";
// import Placeholder from "./layout/Placeholder.jsx";
import Analytics from "./admin/pages/Analytics.jsx";
// import ReadingTrendChart from "./admin/dashboard/ReadingTrendChart.jsx";
import ReadingActivity from "./admin/pages/ReadingActivity.jsx";
import ActivityLog from "./admin/pages/ActivityLog.jsx";
import Setting from "./admin/pages/Settings.jsx";
import Notifications from "./admin/pages/Notifications.jsx";
import SentNotifications from "./admin/pages/SentNotifications.jsx";
import FeaturedMasterpieces from "./admin/pages/FeaturedMasterpieces.jsx";
import PopularThisWeek from "./admin/pages/PopularThisWeek.jsx";
import ReviewManagement from "./admin/pages/ReviewManagement.jsx";
// import Reviews from "./admin/pages/Reviews.jsx";

/* ------------------------------------------------------------------ */
/*  Lazy-loaded pages — chunked for fast initial paint                */
/* ------------------------------------------------------------------ */
/* Public */
const HomeIcon = lazy(() => import("./pages/home/index.jsx"));
const About = lazy(() => import("./pages/home/components/About.jsx"));
const ExploreBooks = lazy(
  () => import("./pages/home/components/ExploreBooks.jsx"),
);
const Categories = lazy(() => import("./pages/home/components/Categories.jsx"));
const Contact = lazy(() => import("./pages/home/components/Contact.jsx"));
const BookReader = lazy(() => import("./pages/reader/BookReader.jsx"));
const DownloadApp = lazy(() => import("./pages/info/DownloadApp.jsx"));
const PolicyAndHelp = lazy(() => import("./pages/info/PolicyAndHelp.jsx"));

/* Admin auth */
const AdminLogin = lazy(() => import("./admin/authAdmin/AdminLogin.jsx"));
const AdminRegister = lazy(() => import("./admin/authAdmin/AdminRegister.jsx"));

/* Admin app */
const Dashboard = lazy(() => import("./admin/Dashboard.jsx"));
const Users = lazy(() => import("./admin/pages/Users.jsx"));
const AllBooks = lazy(() => import("./admin/pages/AllBooks.jsx"));
const UploadBook = lazy(() => import("./admin/pages/UploadBook"));
const AdminCategories = lazy(() => import("./admin/pages/AdminCategories.jsx"));
const EditBook = lazy(() => import("./admin/components/EditBook.jsx"));
const Profile = lazy(() => import("./admin/pages/Profile.jsx"));
// import { from } from "../node_modules/@types/stylis/index.d";

/* ------------------------------------------------------------------ */
/*  Page-level loader (light tone for dark reader, dark for light)   */
/* ------------------------------------------------------------------ */
function PageLoader({ tone = "dark" }) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        tone === "light" ? "bg-primary" : "bg-cream"
      }`}
    >
      <Loader size={32} tone={tone} label="Loading" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public layout — Navbar + Footer                                    */
/* ------------------------------------------------------------------ */
function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader tone="dark" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin layout wrapper with its own Suspense                         */
/* ------------------------------------------------------------------ */
function AdminAppShell() {
  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader tone="dark" />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        {/* ================= PUBLIC (full-screen reader) ================= */}
        <Route
          path="/read/:id"
          element={
            <Suspense fallback={<PageLoader tone="light" />}>
              <BookReader />
            </Suspense>
          }
        />

        {/* ================= PUBLIC (with Navbar + Footer) ================= */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomeIcon />} />
          <Route path="/about" element={<About />} />
          <Route path="/explore" element={<ExploreBooks />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/download" element={<DownloadApp />} />
          <Route path="/privacy" element={<PolicyAndHelp section="privacy" />} />
          <Route path="/terms" element={<PolicyAndHelp section="terms" />} />
          <Route path="/help" element={<PolicyAndHelp section="help" />} />
          <Route path="/report" element={<PolicyAndHelp section="report" />} />
        </Route>

        {/* ================= ADMIN AUTH (full-screen) ================= */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<PageLoader tone="dark" />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/admin/register"
          element={
            <Suspense fallback={<PageLoader tone="dark" />}>
              <AdminRegister />
            </Suspense>
          }
        />

        {/* ================= ADMIN APP (protected + sidebar) ================= */}
        <Route
          element={
            <ProtectedRoute>
              <AdminAppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/books" element={<AllBooks />} />
          <Route path="/admin/books/upload" element={<UploadBook />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/books/edit/:id" element={<EditBook />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/reading-activity" element={<ReadingActivity />} />
          <Route path="/admin/activity-log" element={<ActivityLog />} />
          <Route path="/admin/profile" element={<Profile />} />
          <Route path="/admin/settings" element={<Setting />} />
          <Route path="/admin/notifications" element={<Notifications />} />
          <Route path="/admin/featured" element={<FeaturedMasterpieces />} />
          {/* <Route path="/admin/reviews" element={<Reviews />} /> */}
          <Route path="/admin/popular" element={<PopularThisWeek />} />
          <Route path="/admin/reviews" element={<ReviewManagement />} />
          <Route
            path="/admin/notifications/sent"
            element={<SentNotifications />}
          />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
