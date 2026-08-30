"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Child = {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
  nationality: string;
  status: "active" | "inactive";
  families: {
    id: string;
    family_name: string;
  } | null;
};

type ChildrenListProps = {
  children: Child[];
};

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference =
    today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

export default function ChildrenList({
  children,
}: ChildrenListProps) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [family, setFamily] = useState("");

  const families = useMemo(() => {
    const map = new Map<string, string>();

    children.forEach((child) => {
      if (child.families) {
        map.set(
          child.families.id,
          child.families.family_name
        );
      }
    });

    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], "ar")
    );
  }, [children]);

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const matchesSearch =
        child.full_name
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesGender =
        !gender || child.gender === gender;

      const matchesFamily =
        !family || child.families?.id === family;

      return (
        matchesSearch &&
        matchesGender &&
        matchesFamily
      );
    });
  }, [children, search, gender, family]);

  const maleCount = children.filter(
    (child) => child.gender === "male"
  ).length;

  const femaleCount = children.filter(
    (child) => child.gender === "female"
  ).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            الأطفال
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة بيانات الأطفال المسجلين في المؤسسة
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">

          <Link
            href="/children/import"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            📥 استيراد الأطفال
          </Link>

          <Link
            href="/children/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#16304f]"
          >
            + إضافة طفل
          </Link>

        </div>

      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            إجمالي الأطفال
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {children.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            الذكور
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {maleCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            الإناث
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {femaleCount}
          </p>
        </div>

      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث عن طفل بالاسم..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#1e3a5f] focus:bg-white"
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f]"
          >
            <option value="">
              الجنس: الكل
            </option>

            <option value="male">
              ذكور
            </option>

            <option value="female">
              إناث
            </option>
          </select>

          <select
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f]"
          >
            <option value="">
              العائلة: الكل
            </option>

            {families.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

        </div>

        {(search || gender || family) && (
          <div className="mt-3 flex items-center justify-between">

            <p className="text-xs text-slate-500">
              عرض {filteredChildren.length} من {children.length} طفل
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setGender("");
                setFamily("");
              }}
              className="text-xs font-medium text-[#1e3a5f] hover:underline"
            >
              مسح الفلاتر
            </button>

          </div>
        )}

      </div>

      {/* Children */}
      {filteredChildren.length === 0 ? (

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            👧
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {children.length === 0
              ? "لا يوجد أطفال مسجلون بعد"
              : "لا توجد نتائج"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {children.length === 0
              ? "ابدأ بإضافة أول طفل إلى قاعدة بيانات مؤسسة كهاتين."
              : "جرّب تغيير البحث أو الفلاتر المستخدمة."}
          </p>

          {children.length === 0 && (
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">

              <Link
                href="/children/import"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                📥 استيراد الأطفال
              </Link>

              <Link
                href="/children/new"
                className="inline-flex rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-medium text-white hover:bg-[#16304f]"
              >
                إضافة أول طفل
              </Link>

            </div>
          )}

        </div>

      ) : (

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {filteredChildren.map((child) => {

            const age = calculateAge(
              child.date_of_birth
            );

            return (
              <Link
                key={child.id}
                href={`/children/${child.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                    {child.gender === "male"
                      ? "👦"
                      : "👧"}
                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="truncate font-semibold text-slate-900 group-hover:text-[#1e3a5f]">
                      {child.full_name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {age} سنة
                    </p>

                  </div>

                </div>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">

                  <div className="flex justify-between gap-3 text-sm">

                    <span className="text-slate-500">
                      العائلة
                    </span>

                    <span className="truncate font-medium text-slate-700">
                      {child.families?.family_name ||
                        "غير محددة"}
                    </span>

                  </div>

                  <div className="flex justify-between gap-3 text-sm">

                    <span className="text-slate-500">
                      الجنس
                    </span>

                    <span className="font-medium text-slate-700">
                      {child.gender === "male"
                        ? "ذكر"
                        : "أنثى"}
                    </span>

                  </div>

                  <div className="flex justify-between gap-3 text-sm">

                    <span className="text-slate-500">
                      الحالة
                    </span>

                    <span
                      className={
                        child.status === "active"
                          ? "font-medium text-green-600"
                          : "font-medium text-slate-400"
                      }
                    >
                      {child.status === "active"
                        ? "نشط"
                        : "غير نشط"}
                    </span>

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