import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardFilter from "@/components/dashboard/dashboard-filter";

type AttendanceRankingItem = {
  child_id: string;
  full_name: string;
  gender: string;
  attendance_points: number;
  ranking: number;
};

type DashboardPageProps = {
  searchParams: Promise<{
    period?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { period = "today" } = await searchParams;
  const supabase = await createClient();

    /*
   * حساب الفترة الزمنية حسب توقيت ليبيا
   */
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Africa/Tripoli",
    }
  );

  const today = dateFormatter.format(now);

  let fromDate = today;
  let toDate = today;

  const tripoliDate = new Date(
    `${today}T12:00:00+02:00`
  );

  if (period === "week") {
    const day = tripoliDate.getDay();

    /*
     * JavaScript:
     * الأحد = 0
     * الاثنين = 1
     * ...
     * السبت = 6
     *
     * نعتبر الأسبوع يبدأ يوم الأحد.
     */
    const daysFromSunday = day;

    tripoliDate.setDate(
      tripoliDate.getDate() - daysFromSunday
    );

    fromDate = dateFormatter.format(tripoliDate);
  }

  if (period === "month") {
    fromDate = `${today.slice(0, 7)}-01`;
  }

  if (period === "year") {
    fromDate = `${today.slice(0, 4)}-01-01`;
  }

  /*
   * الأطفال
   */
  const { count: childrenCount, error: childrenError } =
    await supabase
      .from("children")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active");

  /*
   * اللقاءات
   */
  const { count: meetingsCount, error: meetingsError } =
  await supabase
    .from("meetings")
    .select("*", {
      count: "exact",
      head: true,
    })
    .gte("meeting_date", fromDate)
    .lte("meeting_date", toDate);

        /*
   * آخر اللقاءات
   */
  const { data: recentMeetings, error: recentMeetingsError } =
    await supabase
      .from("meetings")
      .select(`
        id,
        meeting_date,
        title
      `)
      .order("meeting_date", { ascending: false })
      .limit(5);

  if (recentMeetingsError) {
    console.error(
      "Failed to load recent meetings:",
      recentMeetingsError
    );
  }

  /*
   * إحصائيات الحضور لآخر اللقاءات
   */
  const recentMeetingIds =
    recentMeetings?.map((meeting) => meeting.id) ?? [];

  let recentAttendance: {
    meeting_id: string;
    status: string;
  }[] = [];

  if (recentMeetingIds.length > 0) {
    const { data, error: recentAttendanceError } =
      await supabase
        .from("attendance")
        .select("meeting_id, status")
        .in("meeting_id", recentMeetingIds);

    if (recentAttendanceError) {
      console.error(
        "Failed to load recent attendance:",
        recentAttendanceError
      );
    } else {
      recentAttendance = data ?? [];
    }
  }

 
  /*
   * الحضور اليوم
   */
  const { data: todayMeetings, error: todayMeetingsError } =
    await supabase
      .from("meetings")
      .select("id")
      .eq("meeting_date", today);

  const todayMeetingIds =
    todayMeetings?.map((meeting) => meeting.id) ?? [];

 /*
 * الحضور اليوم
 */
/*
 * الحضور في الفترة المحددة
 */
const { data: periodMeetings, error: periodMeetingsError } =
  await supabase
    .from("meetings")
    .select("id")
    .gte("meeting_date", fromDate)
    .lte("meeting_date", toDate);

const periodMeetingIds =
  periodMeetings?.map((meeting) => meeting.id) ?? [];

let periodPresentCount = 0;
let periodRecordedCount = 0;

if (periodMeetingIds.length > 0) {
  const { data: periodAttendance, error: attendanceError } =
    await supabase
      .from("attendance")
      .select("status")
      .in("meeting_id", periodMeetingIds);

  if (attendanceError) {
    console.error(
      "Failed to load attendance for selected period:",
      attendanceError
    );
  } else {
    periodPresentCount =
      periodAttendance?.filter(
        (item) => item.status === "present"
      ).length ?? 0;

    periodRecordedCount =
      periodAttendance?.length ?? 0;
  }
}

const periodAttendanceRate =
  periodRecordedCount > 0
    ? Math.round(
        (periodPresentCount / periodRecordedCount) * 100
      )
    : 0;
  /*
   * الدخل
   */
  const { data: incomeData, error: incomeError } =
    await supabase
      .from("income")
      .select("amount, income_type");

  /*
   * المصروفات
   */
  const { data: expensesData, error: expensesError } =
    await supabase
      .from("expenses")
      .select("amount");

  if (childrenError) {
    console.error(
      "Failed to load children count:",
      childrenError
    );
  }

  if (meetingsError) {
    console.error(
      "Failed to load meetings count:",
      meetingsError
    );
  }

  if (todayMeetingsError) {
    console.error(
      "Failed to load today's meetings:",
      todayMeetingsError
    );
  }

  if (incomeError) {
    console.error(
      "Failed to load income:",
      incomeError
    );
  }

  if (expensesError) {
    console.error(
      "Failed to load expenses:",
      expensesError
    );
  }

  /*
   * حساب الرصيد
   *
   * نحتسب فقط الدخل النقدي والبنكي.
   * الدخل العيني لا يدخل في الرصيد النقدي.
   */
  const totalIncome =
    incomeData?.reduce((total, item) => {
      if (
        item.income_type === "cash" ||
        item.income_type === "bank"
      ) {
        return total + Number(item.amount ?? 0);
      }

      return total;
    }, 0) ?? 0;

  const totalExpenses =
    expensesData?.reduce(
      (total, item) =>
        total + Number(item.amount ?? 0),
      0
    ) ?? 0;

  const balance = totalIncome - totalExpenses;

  /*
   * ترتيب الأكثر حضورًا
   */
  const {
  data: attendanceRanking,
  error: rankingError,
} = await supabase.rpc("get_attendance_ranking", {
  p_from_date: fromDate,
  p_to_date: toDate,
});

  if (rankingError) {
    console.error(
      "Failed to load attendance ranking:",
      rankingError
    );
  }
  const recentMeetingsWithStats =
    (recentMeetings ?? []).map((meeting) => {
      const attendance =
        recentAttendance.filter(
          (record) =>
            record.meeting_id === meeting.id
        );

      const presentCount =
        attendance.filter(
          (record) =>
            record.status === "present"
        ).length;

      const absentCount =
        attendance.filter(
          (record) =>
            record.status === "absent"
        ).length;

      const excusedCount =
        attendance.filter(
          (record) =>
            record.status === "excused"
        ).length;

      return {
        ...meeting,
        presentCount,
        absentCount,
        excusedCount,
      };
    });

    
const topAttendance =
  (attendanceRanking as AttendanceRankingItem[] | null)?.slice(0, 5) ?? [];
  const stats = [
    {
      title: "الأطفال",
      value: childrenCount ?? 0,
    },
    {
      title: "اللقاءات",
      value: meetingsCount ?? 0,
    },
  {
  title: "الحضور في الفترة",
  value:
    periodRecordedCount > 0
      ? `${periodPresentCount} / ${periodRecordedCount}`
      : "لا يوجد تسجيل",
  description:
    periodRecordedCount > 0
      ? `${periodAttendanceRate}% نسبة الحضور`
      : "لا توجد حالات حضور مسجلة",
},
    {
      title: "الرصيد",
      value: `${balance.toLocaleString("ar-LY")} د.ل`,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          الرئيسية
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          مرحبًا بك في نظام إدارة مؤسسة كهاتين
        </p>
      </div>

      {/* Dashboard Filter */}
<DashboardFilter />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {stat.title}
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
  {stat.value}
</p>

{"description" in stat && stat.description && (
  <p className="mt-1 text-xs text-slate-500">
    {stat.description}
  </p>
)}
          </div>
        ))}

      </div>

      {/* Most Attendance */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              🏆 الأكثر حضورًا
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              ترتيب الأطفال حسب نقاط الحضور
            </p>
          </div>

          <Link
            href="/attendance"
            className="text-sm font-medium text-[#1e3a5f] hover:underline"
          >
            عرض الكل
          </Link>

        </div>

        {topAttendance.length > 0 ? (
          <div className="divide-y divide-slate-100">

            {topAttendance.map((child) => {

              const rank = Number(child.ranking);

              return (
                <div
                  key={child.child_id}
                  className="flex items-center justify-between px-6 py-4"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                      {rank}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {child.full_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {child.attendance_points} نقطة حضور
                      </p>
                    </div>

                  </div>

                  <div className="text-xl">
                    {rank === 1
                      ? "🥇"
                      : rank === 2
                      ? "🥈"
                      : rank === 3
                      ? "🥉"
                      : "⭐"}
                  </div>

                </div>
              );
            })}

          </div>
        ) : (
          <div className="px-6 py-10 text-center">

            <p className="text-sm text-slate-500">
              لا توجد بيانات حضور حتى الآن.
            </p>

          </div>
        )}

      </section>

            {/* Recent Meetings */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              📅 آخر اللقاءات
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              آخر اللقاءات المسجلة في المؤسسة
            </p>
          </div>

          <Link
            href="/meetings"
            className="text-sm font-medium text-[#1e3a5f] hover:underline"
          >
            عرض الكل
          </Link>

        </div>

        {recentMeetingsWithStats.length > 0 ? (
          <div className="divide-y divide-slate-100">

            {recentMeetingsWithStats.map((meeting) => {

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
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="block px-6 py-5 transition hover:bg-slate-50"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                        📅
                      </div>

                      <div>
                        <h3 className="font-medium text-slate-900">
                          {meeting.title ||
                            "لقاء بدون عنوان"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {formattedDate}
                        </p>
                      </div>

                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">

                      <span className="rounded-lg bg-green-50 px-3 py-1.5 font-medium text-green-700">
                        حاضر {meeting.presentCount}
                      </span>

                      <span className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-700">
                        غائب {meeting.absentCount}
                      </span>

                      <span className="rounded-lg bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                        معذور {meeting.excusedCount}
                      </span>

                    </div>

                  </div>

                </Link>
              );
            })}

          </div>
        ) : (
          <div className="px-6 py-10 text-center">

            <p className="text-sm text-slate-500">
              لا توجد لقاءات حتى الآن.
            </p>

          </div>
        )}

      </section>

    </div>
  );
}