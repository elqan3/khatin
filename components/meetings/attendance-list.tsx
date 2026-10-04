"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Child = {
  id: string;
  full_name: string;
  gender: string;
};

type AttendanceRecord = {
  id: string;
  child_id: string;
  status: "present" | "absent" | "excused";
  notes: string | null;
};

type AttendanceListProps = {
  meetingId: string;
  children: Child[];
  initialAttendance: AttendanceRecord[];
};

export default function AttendanceList({
  meetingId,
  children,
  initialAttendance,
}: AttendanceListProps) {
  const supabase = createClient();

  const [attendance, setAttendance] =
    useState(initialAttendance);

  const [loadingChildId, setLoadingChildId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [pointSettings, setPointSettings] = useState({
    participation: 1,
    special: 1,
  });

  const [pointLoading, setPointLoading] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("point_settings")
      .select("action_type, points")
      .in("action_type", ["participation", "special"])
      .then(({ data }) => {
        if (!mounted || !data) return;

        setPointSettings((current) => ({
          participation:
            data.find((row) => row.action_type === "participation")?.points ??
            current.participation,
          special:
            data.find((row) => row.action_type === "special")?.points ??
            current.special,
        }));
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function addPoint(
    childId: string,
    actionType: "participation" | "special"
  ) {
    setError("");
    setPointLoading(`${childId}-${actionType}`);

    try {
      const { error: pointError } = await supabase.rpc(
        "add_point_transaction",
        {
          p_child_id: childId,
          p_action_type: actionType,
          p_meeting_id: meetingId,
        }
      );

      if (pointError) throw pointError;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "حدث خطأ أثناء إضافة النقاط.");
    } finally {
      setPointLoading(null);
    }
  }

  const attendanceMap = new Map(
    attendance.map((record) => [
      record.child_id,
      record,
    ])
  );

  const presentCount = attendance.filter(
    (item) => item.status === "present"
  ).length;

  const absentCount = attendance.filter(
    (item) => item.status === "absent"
  ).length;

  const excusedCount = attendance.filter(
    (item) => item.status === "excused"
  ).length;

  const notRecordedCount =
    children.length -
    presentCount -
    absentCount -
    excusedCount;

  async function handleStatusChange(
    childId: string,
    status: "present" | "absent" | "excused"
  ) {
    setError("");
    setLoadingChildId(childId);

    const previousAttendance = attendance;

    try {
      const existingRecord =
        attendanceMap.get(childId);

      /*
       * تحديث الواجهة فورًا
       */
      if (existingRecord) {
        setAttendance((current) =>
          current.map((record) =>
            record.child_id === childId
              ? {
                  ...record,
                  status,
                }
              : record
          )
        );

        const { error: updateError } =
          await supabase
            .from("attendance")
            .update({
              status,
            })
            .eq("id", existingRecord.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        /*
         * إنشاء سجل جديد
         */
        const temporaryRecord: AttendanceRecord = {
          id: `temp-${childId}`,
          child_id: childId,
          status,
          notes: null,
        };

        setAttendance((current) => [
          ...current,
          temporaryRecord,
        ]);

        const { data, error: insertError } =
          await supabase
            .from("attendance")
            .insert({
              meeting_id: meetingId,
              child_id: childId,
              status,
            })
            .select(
              "id, child_id, status, notes"
            )
            .single();

        if (insertError) {
          throw insertError;
        }

        /*
         * استبدال السجل المؤقت بالسجل الحقيقي
         */
        setAttendance((current) =>
          current.map((record) =>
            record.id === temporaryRecord.id
              ? data
              : record
          )
        );
      }
    } catch (err: any) {
      console.error(err);

      /*
       * إعادة الواجهة إلى حالتها السابقة
       */
      setAttendance(previousAttendance);

      setError(
        err?.message ||
          "حدث خطأ أثناء حفظ الحضور."
      );
    } finally {
      setLoadingChildId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          حضور الأطفال
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          تسجيل حضور وغياب الأطفال في هذا اللقاء
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-xs font-medium text-green-700">
            حاضر
          </p>

          <p className="mt-2 text-xl font-bold text-green-700">
            {presentCount}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-xs font-medium text-red-700">
            غائب
          </p>

          <p className="mt-2 text-xl font-bold text-red-700">
            {absentCount}
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-700">
            معذور
          </p>

          <p className="mt-2 text-xl font-bold text-amber-700">
            {excusedCount}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-4">
          <p className="text-xs font-medium text-slate-600">
            لم يسجل
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {notRecordedCount}
          </p>
        </div>

      </div>

      {/* Children */}
      {children.length > 0 ? (
        <div className="mt-6 space-y-3">

          {children.map((child) => {
            const record =
              attendanceMap.get(child.id);

            const status = record?.status;

            const isLoading =
              loadingChildId === child.id;

            return (
              <div
                key={child.id}
                className="rounded-xl border border-slate-200 p-4"
              >

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  {/* Child */}
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                      {child.gender === "male"
                        ? "👦"
                        : "👧"}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {child.full_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {status === "present"
                          ? "حاضر"
                          : status === "absent"
                          ? "غائب"
                          : status === "excused"
                          ? "معذور"
                          : "لم يتم التسجيل"}
                      </p>
                    </div>

                  </div>

                  {/* Points + attendance */}
                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      disabled={pointLoading !== null}
                      onClick={() => addPoint(child.id, "participation")}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      {pointLoading === `${child.id}-participation`
                        ? "..."
                        : `مشاركة ${pointSettings.participation >= 0 ? "+" : ""}${pointSettings.participation}`}
                    </button>

                    <button
                      type="button"
                      disabled={pointLoading !== null}
                      onClick={() => addPoint(child.id, "special")}
                      className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
                    >
                      {pointLoading === `${child.id}-special`
                        ? "..."
                        : `خاص ${pointSettings.special >= 0 ? "+" : ""}${pointSettings.special}`}
                    </button>

                                        <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        handleStatusChange(
                          child.id,
                          "present"
                        )
                      }
                      className={`rounded-lg border px-4 py-2 text-xs font-medium transition ${
                        status === "present"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isLoading &&
                      status === "present"
                        ? "..."
                        : "حاضر"}
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        handleStatusChange(
                          child.id,
                          "absent"
                        )
                      }
                      className={`rounded-lg border px-4 py-2 text-xs font-medium transition ${
                        status === "absent"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isLoading &&
                      status === "absent"
                        ? "..."
                        : "غائب"}
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        handleStatusChange(
                          child.id,
                          "excused"
                        )
                      }
                      className={`rounded-lg border px-4 py-2 text-xs font-medium transition ${
                        status === "excused"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isLoading &&
                      status === "excused"
                        ? "..."
                        : "معذور"}
                    </button>

                  </div>
                </div>

              </div>
            );
          })}

        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">
            لا يوجد أطفال نشطون حاليًا.
          </p>
        </div>
      )}

    </section>
  );
}