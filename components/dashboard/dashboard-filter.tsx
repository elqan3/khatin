"use client";

import { useRouter, useSearchParams } from "next/navigation";

const periods = [
  {
    value: "today",
    label: "اليوم",
  },
  {
    value: "week",
    label: "هذا الأسبوع",
  },
  {
    value: "month",
    label: "هذا الشهر",
  },
  {
    value: "year",
    label: "هذه السنة",
  },
  {
    value: "custom",
    label: "فترة مخصصة",
  },
];

export default function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPeriod =
    searchParams.get("period") || "today";

  function handlePeriodChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const period = event.target.value;

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("period", period);

    /*
     * عند العودة من الفترة المخصصة
     * نحذف التواريخ القديمة.
     */
    if (period !== "custom") {
      params.delete("from");
      params.delete("to");
    }

    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-semibold text-slate-900">
            الفترة الزمنية
          </p>

          <p className="mt-1 text-xs text-slate-500">
            اختر الفترة التي تريد عرض بياناتها
          </p>
        </div>

        <select
          value={currentPeriod}
          onChange={handlePeriodChange}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
        >
          {periods.map((period) => (
            <option
              key={period.value}
              value={period.value}
            >
              {period.label}
            </option>
          ))}
        </select>

      </div>

    </div>
  );
}