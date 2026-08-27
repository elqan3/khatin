"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Mobile */}
      <div className="mr-14 lg:hidden">
  <h1 className="font-bold text-[#1e3a5f]">
    كهاتين
  </h1>
</div>
        {/* Desktop */}
        <div className="hidden lg:block" />

        {/* User */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8eef5] text-sm font-bold text-[#1e3a5f]">
              م
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                مدير المؤسسة
              </p>

              <p className="text-xs text-slate-500">
                مدير
              </p>
            </div>

            <span className="text-xs text-slate-400">
              ▾
            </span>
          </button>

          {open && (
            <div className="absolute left-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-right text-sm text-red-600 hover:bg-red-50"
              >
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}