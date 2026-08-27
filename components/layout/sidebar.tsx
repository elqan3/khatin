"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    title: "الرئيسية",
    href: "/",
    icon: "⌂",
  },
  {
    title: "الأطفال",
    href: "/children",
    icon: "👧",
  },
  {
    title: "العائلات",
    href: "/families",
    icon: "👨‍👩‍👧",
  },
  {
    title: "اللقاءات",
    href: "/meetings",
    icon: "📅",
  },
  {
    title: "النقاط",
    href: "/points",
    icon: "⭐",
  },
  {
    title: "المالية",
    href: "/finance",
    icon: "💰",
  },
  {
    title: "التقارير",
    href: "/reports",
    icon: "📊",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 border-l border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e3a5f]">
              كهاتين
            </h1>

            <p className="text-xs text-slate-500">
              نظام إدارة المؤسسة
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-[#e8eef5] text-[#1e3a5f]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="w-6 text-center">
                  {item.icon}
                </span>

                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-200 p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            <span>⚙</span>
            <span>الإعدادات</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}