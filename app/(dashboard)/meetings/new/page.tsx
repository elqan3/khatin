"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewMeetingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [meetingDate, setMeetingDate] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!meetingDate) {
      setError("يرجى اختيار تاريخ اللقاء.");
      return;
    }

    setLoading(true);

    try {
      const { data: meeting, error: meetingError } =
        await supabase
          .from("meetings")
          .insert({
            meeting_date: meetingDate,
            title: title.trim() || null,
            notes: notes.trim() || null,
          })
          .select("id")
          .single();

      if (meetingError) {
        throw meetingError;
      }

      router.push(`/meetings/${meeting.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "حدث خطأ أثناء إنشاء اللقاء."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* العودة */}
      <div>
        <Link
          href="/meetings"
          className="text-sm text-slate-500 transition hover:text-[#1e3a5f]"
        >
          العودة إلى اللقاءات
        </Link>
      </div>

      {/* العنوان */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          إضافة لقاء
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          إنشاء لقاء جديد للمؤسسة
        </p>
      </div>

      {/* النموذج */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* التاريخ */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              تاريخ اللقاء
            </label>

            <input
              type="date"
              value={meetingDate}
              onChange={(e) =>
                setMeetingDate(e.target.value)
              }
              disabled={loading}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* العنوان */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              عنوان اللقاء
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="مثال: اللقاء الأسبوعي"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* الملاحظات */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ملاحظات
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              rows={4}
              placeholder="أي ملاحظات عن اللقاء..."
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* الخطأ */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* الأزرار */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

            <Link
              href="/meetings"
              className="inline-flex justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#16304f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "جاري الحفظ..."
                : "حفظ اللقاء"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}