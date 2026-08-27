"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { title: "الرئيسية", href: "/", icon: "⌂" },
  { title: "الأطفال", href: "/children", icon: "👧" },
  { title: "العائلات", href: "/families", icon: "👨‍👩‍👧" },
  { title: "اللقاءات", href: "/meetings", icon: "📅" },
  { title: "النقاط", href: "/points", icon: "⭐" },
  { title: "المالية", href: "/finance", icon: "💰" },
  { title: "التقارير", href: "/reports", icon: "📊" },
  { title: "الإعدادات", href: "/settings", icon: "⚙" },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* زر القائمة */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        className="fixed right-4 top-3 z-[9999] flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm lg:hidden"
      >
        ☰
      </button>

      {/* القائمة */}
      {open && (
        <>
          {/* الخلفية */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/40 lg:hidden"
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-[9999] flex h-[100dvh] w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl lg:hidden">
            
            {/* الرأس */}
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-5">
              <div>
                <h1 className="text-xl font-bold text-[#1e3a5f]">
                  كهاتين
                </h1>

                <p className="text-xs text-slate-500">
                  نظام إدارة المؤسسة
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* الروابط */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" &&
                      pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                        active
                          ? "bg-[#e8eef5] text-[#1e3a5f]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-6 text-center">
                        {item.icon}
                      </span>

                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}