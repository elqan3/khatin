import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AttendanceList from "@/components/meetings/attendance-list";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MeetingPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // جلب اللقاء
  const { data: meeting, error: meetingError } =
    await supabase
      .from("meetings")
      .select(`
        id,
        meeting_date,
        title,
        notes
      `)
      .eq("id", id)
      .single();

  if (meetingError || !meeting) {
    notFound();
  }

  // جلب الأطفال النشطين
  const { data: children, error: childrenError } =
    await supabase
      .from("children")
      .select(`
        id,
        full_name,
        gender
      `)
      .eq("status", "active")
      .order("full_name");

  if (childrenError) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/meetings"
            className="text-sm text-slate-500 hover:text-[#1e3a5f]"
          >
            العودة إلى اللقاءات
          </Link>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-800">
            حدث خطأ أثناء تحميل الأطفال
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {childrenError.message}
          </p>
        </div>
      </div>
    );
  }

  // جلب الحضور لهذا اللقاء
  const { data: attendance, error: attendanceError } =
    await supabase
      .from("attendance")
      .select(`
        id,
        child_id,
        status,
        notes
      `)
      .eq("meeting_id", id);

  if (attendanceError) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/meetings"
            className="text-sm text-slate-500 hover:text-[#1e3a5f]"
          >
            العودة إلى اللقاءات
          </Link>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-800">
            حدث خطأ أثناء تحميل الحضور
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {attendanceError.message}
          </p>
        </div>
      </div>
    );
  }

  const attendanceMap = new Map(
    (attendance ?? []).map((record) => [
      record.child_id,
      record.status,
    ])
  );

  const presentCount =
    attendance?.filter(
      (item) => item.status === "present"
    ).length ?? 0;

  const absentCount =
    attendance?.filter(
      (item) => item.status === "absent"
    ).length ?? 0;

  const excusedCount =
    attendance?.filter(
      (item) => item.status === "excused"
    ).length ?? 0;

  const notRecordedCount =
    (children?.length ?? 0) -
    presentCount -
    absentCount -
    excusedCount;

  const formattedDate =
    new Intl.DateTimeFormat("ar-LY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(
      new Date(meeting.meeting_date)
    );

  return (
    <div className="space-y-6">

      {/* العودة */}
      <div>
        <Link
          href="/meetings"
          className="text-sm text-slate-500 transition hover:text-[#1e3a5f]"
        >
          العودة إلى اللقاءات
        </Link>
      </div>

      {/* معلومات اللقاء */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                📅
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {meeting.title || "لقاء بدون عنوان"}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {formattedDate}
                </p>
              </div>

            </div>

            {meeting.notes && (
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                {meeting.notes}
              </p>
            )}
          </div>

          <Link
            href="/meetings"
            className="inline-flex justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            كل اللقاءات
          </Link>

        </div>

      </div>

      {/* إحصائيات الحضور */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            حاضر
          </p>

          <p className="mt-3 text-2xl font-bold text-green-600">
            {presentCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            غائب
          </p>

          <p className="mt-3 text-2xl font-bold text-red-600">
            {absentCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            معذور
          </p>

          <p className="mt-3 text-2xl font-bold text-amber-600">
            {excusedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            لم يسجل
          </p>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {notRecordedCount}
          </p>
        </div>

      </div>

      {/* الأطفال */}
    
<AttendanceList
  meetingId={meeting.id}
  children={children ?? []}
  initialAttendance={attendance ?? []}
/>
    </div>
  );
}