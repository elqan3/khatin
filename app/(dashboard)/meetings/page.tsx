import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MeetingsPage() {
  const supabase = await createClient();

  const { data: meetings, error } = await supabase
    .from("meetings")
    .select(`
      id,
      meeting_date,
      title,
      notes
    `)
    .order("meeting_date", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            اللقاءات
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة لقاءات المؤسسة والحضور والغياب
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            حدث خطأ أثناء تحميل اللقاءات
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            اللقاءات
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة لقاءات المؤسسة والحضور والغياب
          </p>
        </div>

        <Link
          href="/meetings/new"
          className="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#16304f]"
        >
          + إضافة لقاء
        </Link>

      </div>

      {/* Empty State */}
      {!meetings || meetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
            📅
          </div>

          <h2 className="mt-5 text-base font-semibold text-slate-800">
            لا توجد لقاءات حتى الآن
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            ابدأ بإنشاء أول لقاء للمؤسسة، وبعد ذلك يمكنك
            تسجيل حضور الأطفال وغيابهم وإدارة النقاط.
          </p>

          <Link
            href="/meetings/new"
            className="mt-6 inline-flex rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#16304f]"
          >
            إنشاء أول لقاء
          </Link>

        </div>
      ) : (

        /* Meetings */
        <div className="space-y-3">

          {meetings.map((meeting) => {

            const date = new Date(
              meeting.meeting_date
            );

            const formattedDate =
              new Intl.DateTimeFormat("ar-LY", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(date);

            return (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex min-w-0 items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                      📅
                    </div>

                    <div className="min-w-0">

                      <h2 className="truncate font-semibold text-slate-900">
                        {meeting.title ||
                          "لقاء بدون عنوان"}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {formattedDate}
                      </p>

                      {meeting.notes && (
                        <p className="mt-2 line-clamp-1 text-xs text-slate-400">
                          {meeting.notes}
                        </p>
                      )}

                    </div>

                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium text-[#1e3a5f]">
                    عرض اللقاء
                    <span>←</span>
                  </div>

                </div>

              </Link>
            );
          })}

        </div>
      )}

    </div>
  );
}