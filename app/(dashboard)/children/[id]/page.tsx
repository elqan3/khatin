import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChildRelationships from "./child-relationships";

type ChildPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age = age - 1;
  }

  return age;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-LY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function getPhoneOwnerLabel(owner: string | null) {
  if (!owner) {
    return null;
  }

  const labels: Record<string, string> = {
    mother: "الأم",
    father: "الأب",
    grandfather: "الجد",
    grandmother: "الجدة",
    uncle_paternal: "العم",
    aunt_paternal: "العمة",
    uncle_maternal: "الخال",
    aunt_maternal: "الخالة",
    guardian: "الحاضن",
    other: "أخرى",
  };

  return labels[owner] || owner;
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {value || "غير محدد"}
      </p>
    </div>
  );
}

export default async function ChildPage({
  params,
}: ChildPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  /*
   * بيانات الطفل
   */
  const { data: rawChild, error } = await supabase
    .from("children")
    .select(`
      id,
      full_name,
      registration_number,
      date_of_birth,
      gender,
      nationality,
      mother_name,
      guardian_name,
      phone,
      phone_owner,
      notes,
      status,
      photo_path,
      created_at,
      updated_at,
      family_id,
      caregiver_type_id,
      families (
        id,
        family_name,
        notes
      ),
      caregiver_types (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (error || !rawChild) {
    notFound();
  }

  /*
   * Supabase يعيد العلاقات كـ Array.
   * نحولها إلى Object واحد لأن الطفل
   * مرتبط بعائلة واحدة ونوع حاضن واحد.
   */
  const child = {
    ...rawChild,

    families: Array.isArray(rawChild.families)
      ? rawChild.families[0] ?? null
      : rawChild.families ?? null,

    caregiver_types: Array.isArray(rawChild.caregiver_types)
      ? rawChild.caregiver_types[0] ?? null
      : rawChild.caregiver_types ?? null,
  };

  /*
   * علاقات الطفل
   */
  const {
    data: rawRelationships,
    error: relationshipsError,
  } = await supabase
    .from("relationships")
    .select(`
      id,
      relative_name,
      phone,
      notes,
      relationship_type_id,
      related_child_id,
      relationship_types (
        id,
        name
      ),
      related_child:children!relationships_related_child_id_fkey (
        id,
        full_name,
        date_of_birth,
        gender
      )
    `)
    .eq("child_id", child.id)
    .order("created_at", { ascending: false });

  if (relationshipsError) {
    console.error(
      "Failed to load relationships:",
      relationshipsError
    );
  }

  /*
   * تحويل العلاقات من Arrays إلى Objects
   */
  const relationships = (rawRelationships ?? []).map(
    (relationship) => ({
      ...relationship,

      relationship_types: Array.isArray(
        relationship.relationship_types
      )
        ? relationship.relationship_types[0] ?? null
        : relationship.relationship_types ?? null,

      related_child: Array.isArray(
        relationship.related_child
      )
        ? relationship.related_child[0] ?? null
        : relationship.related_child ?? null,
    })
  );

  const age = calculateAge(child.date_of_birth);

  const genderLabel =
    child.gender === "male" ? "ذكر" : "أنثى";

  const statusLabel =
    child.status === "active" ? "نشط" : "غير نشط";

  const phoneOwnerLabel = getPhoneOwnerLabel(
    child.phone_owner
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* العودة */}
      <div>
        <Link
          href="/children"
          className="text-sm text-slate-500 hover:text-[#1e3a5f]"
        >
          العودة إلى الأطفال
        </Link>
      </div>

      {/* رأس الصفحة */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-4xl">
              {child.gender === "male" ? "👦" : "👧"}
            </div>

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-bold text-slate-900">
                  {child.full_name}
                </h1>

                <span
                  className={
                    child.status === "active"
                      ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                      : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                  }
                >
                  {statusLabel}
                </span>

              </div>

              <p className="mt-2 text-sm text-slate-500">

                {genderLabel}

                {" - "}

                {age} سنة

                {child.families?.family_name ? (
                  <>
                    {" - "}
                    {child.families.family_name}
                  </>
                ) : null}

              </p>

            </div>

          </div>

          <div>

            <Link
              href={"/children/" + child.id + "/edit"}
              className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              تعديل الطفل
            </Link>

          </div>

        </div>

      </section>

      {/* البيانات الأساسية */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-900">
          البيانات الأساسية
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          المعلومات الشخصية الأساسية للطفل
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <InfoItem
            label="الاسم الكامل"
            value={child.full_name}
          />

          <InfoItem
            label="رقم القيد"
            value={child.registration_number}
          />

          <InfoItem
            label="تاريخ الميلاد"
            value={formatDate(child.date_of_birth)}
          />

          <InfoItem
            label="العمر"
            value={age + " سنة"}
          />

          <InfoItem
            label="الجنس"
            value={genderLabel}
          />

          <InfoItem
            label="الجنسية"
            value={child.nationality}
          />

          <InfoItem
            label="اسم الأم"
            value={child.mother_name}
          />

        </div>

      </section>

      {/* العائلة + الحاضن */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* العائلة */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            العائلة
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            معلومات العائلة المرتبطة بالطفل
          </p>

          <div className="mt-6 space-y-5">

            <InfoItem
              label="اسم العائلة"
              value={
                child.families
                  ? child.families.family_name
                  : null
              }
            />

            {child.families?.notes ? (
              <div>

                <p className="text-xs font-medium text-slate-400">
                  ملاحظات العائلة
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {child.families.notes}
                </p>

              </div>
            ) : null}

          </div>

        </section>

        {/* الحاضن والتواصل */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            الحاضن والتواصل
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            الشخص المسؤول عن رعاية الطفل وبيانات التواصل
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">

            <InfoItem
              label="نوع الحاضن"
              value={
                child.caregiver_types
                  ? child.caregiver_types.name
                  : null
              }
            />

            <InfoItem
              label="اسم الحاضن"
              value={child.guardian_name}
            />

            <InfoItem
              label="رقم الهاتف"
              value={child.phone}
            />

            <InfoItem
              label="الهاتف لمن؟"
              value={phoneOwnerLabel}
            />

          </div>

        </section>

      </div>

      {/* العلاقات */}
      <ChildRelationships
        childId={child.id}
        relationships={relationships}
      />

      {/* الملاحظات */}
      {child.notes ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            ملاحظات
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {child.notes}
          </p>

        </section>
      ) : null}

      {/* معلومات النظام */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

        <div className="grid gap-4 text-xs text-slate-500 sm:grid-cols-2">

          <div>

            <span className="font-medium">
              تاريخ الإنشاء:{" "}
            </span>

            {formatDate(child.created_at)}

          </div>

          <div className="sm:text-left">

            <span className="font-medium">
              آخر تحديث:{" "}
            </span>

            {formatDate(child.updated_at)}

          </div>

        </div>

      </section>

    </div>
  );
}
