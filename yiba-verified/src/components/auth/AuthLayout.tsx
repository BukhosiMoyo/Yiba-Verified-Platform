import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid lg:grid-cols-2">
        {/* Left Column - Auth Content */}
        <div className="flex items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Right Column - Visual Panel */}
        <div className="hidden lg:flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 border-l border-gray-200/60">
          <div className="flex-1 flex flex-col justify-center px-12 py-16">
            {/* Brand & Headline */}
            <div className="mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-3">
                Yiba Verified
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Streamline your qualification verification
              </p>
              <p className="text-sm text-gray-500">
                Manage documents, track submissions, and ensure compliance with ease.
              </p>
            </div>

            {/* Dashboard Preview Placeholder */}
            <div className="mt-8">
              <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6">
                <div className="space-y-4">
                  {/* Header bar */}
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  
                  {/* Chart placeholder */}
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200/60 flex items-end justify-between p-3 gap-2">
                    <div className="flex-1 h-3/4 bg-blue-100 rounded-t"></div>
                    <div className="flex-1 h-2/3 bg-blue-100 rounded-t"></div>
                    <div className="flex-1 h-full bg-blue-200 rounded-t"></div>
                    <div className="flex-1 h-4/5 bg-blue-100 rounded-t"></div>
                    <div className="flex-1 h-3/4 bg-blue-100 rounded-t"></div>
                  </div>
                  
                  {/* Cards row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 bg-gray-50 rounded-lg border border-gray-200/60"></div>
                    <div className="h-16 bg-gray-50 rounded-lg border border-gray-200/60"></div>
                    <div className="h-16 bg-gray-50 rounded-lg border border-gray-200/60"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
