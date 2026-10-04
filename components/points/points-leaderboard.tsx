"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = {
  child_id: string;
  child_name: string;
  total_points: number;
};

export default function PointsLeaderboard() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("children_points")
        .select("child_id, child_name, total_points")
        .order("total_points", { ascending: false })
        .order("child_name", { ascending: true });

      if (mounted) {
        if (!error && data) setRows(data as Row[]);
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">ترتيب الأطفال</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          الترتيب حسب مجموع النقاط الحالي.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          جارٍ تحميل الترتيب...
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          لا توجد نقاط مسجلة حتى الآن.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          {rows.map((row, index) => (
            <div
              key={row.child_id}
              className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0"
            >
              <div className="text-center font-bold text-muted-foreground">
                {index + 1}
              </div>

              <div className="min-w-0">
                <p className="truncate font-medium">{row.child_name}</p>
              </div>

              <div className="font-bold tabular-nums">
                {row.total_points} نقطة
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
