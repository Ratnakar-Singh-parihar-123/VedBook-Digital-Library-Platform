// src/admin/layout/Placeholder.jsx
export default function Placeholder({ title, description }) {
  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {description || "This page is coming soon."}
      </p>
      <div className="p-12 mt-8 text-center bg-white border border-gray-200 border-dashed rounded-2xl">
        <p className="text-sm text-gray-500">Nothing here yet — coming soon.</p>
      </div>
    </div>
  );
}
