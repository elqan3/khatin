"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACTIONS = [
  ["attendance", "الحضور"],
  ["absence", "الغياب"],
  ["participation", "المشاركة"],
  ["special", "نقاط خاصة"],
] as const;

type ActionType = (typeof ACTIONS)[number][0];

export default function PointsSettings() {
  const supabase = createClient();
  const [values, setValues] = useState<Record<ActionType, number>>({
    attendance: 1,
    absence: -1,
    participation: 1,
    special: 1,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase
      .from("point_settings")
      .select("action_type, points")
      .order("action_type")
      .then(({ data, error }) => {
        if (!mounted || error || !data) return;
        setValues((current) => {
          const next = { ...current };
          for (const row of data) {
            if (row.action_type in next) {
              next[row.action_type as ActionType] = row.points;
            }
          }
          return next;
        });
      });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function save() {
    setSaving(true);
    setMessage("");
    const rows = ACTIONS.map(([action_type]) => ({
      action_type,
      points: values[action_type],
    }));

    const { error } = await supabase
      .from("point_settings")
      .upsert(rows, { onConflict: "action_type" });

    setSaving(false);
    setMessage(
      error
        ? "تعذر حفظ الإعدادات."
        : "تم الحفظ. التغيير يطبّق على العمليات الجديدة فقط؛ النقاط السابقة لا تتغير."
    );
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">قيم النقاط</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          يمكنك استخدام قيم موجبة أو سالبة حسب طبيعة العملية.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIONS.map(([action_type, label]) => (
          <div
            key={action_type}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <span className="font-medium">{label}</span>
            <input
              type="number"
              value={values[action_type]}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  [action_type]: Number(e.target.value),
                }))
              }
              className="w-28 rounded-md border bg-background px-3 py-2 text-center"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </section>
  );
}
