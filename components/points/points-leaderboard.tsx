"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = {
  child_id: string;
  full_name: string;
  total_points: number;
};

export default function PointsLeaderboard() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("children_points")
        .select("child_id, full_name, total_points")
        .order("total_points", { ascending: false })
        .order("full_name", { ascending: true })
        .limit(10);

      if (!mounted) return;

      if (queryError) {
        console.error("Failed to load children leaderboard:", queryError);
        setError("تعذر تحميل ترتيب الأطفال. تحقق من صلاحيات الوصول أو إعدادات قاعدة البيانات.");
        setRows([]);
      } else {
        setRows((data ?? []) as Row[]);
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm" dir="rtl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">أفضل 10 أطفال</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ترتيب الأطفال حسب مجموع النقاط المكتسبة.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          جارٍ تحميل الترتيب...
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          لا توجد نقاط مسجلة حتى الآن.
        </div>
      ) : (
        <ol className="overflow-hidden rounded-lg border">
          {rows.map((row, index) => (
            <li
              key={row.child_id}
              className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0"
            >
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                  index === 0
                    ? "bg-amber-100 text-amber-800"
                    : index === 1
                      ? "bg-slate-200 text-slate-700"
                      : index === 2
                        ? "bg-orange-100 text-orange-800"
                        : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {index + 1}
              </span>

              <span className="min-w-0 truncate font-medium">{row.full_name}</span>

              <span className="whitespace-nowrap font-bold tabular-nums">
                {row.total_points} نقطة
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
