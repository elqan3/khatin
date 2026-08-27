import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChildForm from "@/components/children/child-form";

type EditChildPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditChildPage({
  params,
}: EditChildPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    { data: child, error: childError },
    { data: families, error: familiesError },
    { data: caregiverTypes, error: caregiverTypesError },
  ] = await Promise.all([
    supabase
      .from("children")
      .select(`
        id,
        full_name,
        date_of_birth,
        gender,
        nationality,
        mother_name,
        guardian_name,
        phone,
        phone_owner,
        notes,
        status,
        family_id,
        caregiver_type_id
      `)
      .eq("id", id)
      .single(),

    supabase
      .from("families")
      .select("id, family_name")
      .order("family_name"),

    supabase
      .from("caregiver_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (childError || !child) {
    console.error(
      "Failed to load child:",
      childError
    );

    notFound();
  }

  if (familiesError) {
    console.error(
      "Failed to load families:",
      familiesError
    );

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="font-semibold text-red-800">
          حدث خطأ أثناء تحميل العائلات
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {familiesError.message}
        </p>
      </div>
    );
  }

  if (caregiverTypesError) {
    console.error(
      "Failed to load caregiver types:",
      caregiverTypesError
    );

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="font-semibold text-red-800">
          حدث خطأ أثناء تحميل أنواع الحاضنين
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {caregiverTypesError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* العودة */}
      <div>
        <Link
          href={`/children/${child.id}`}
          className="text-sm text-slate-500 transition hover:text-[#1e3a5f]"
        >
          ← العودة إلى ملف الطفل
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          تعديل بيانات الطفل
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          تعديل البيانات المسجلة للطفل:{" "}
          <span className="font-medium text-slate-700">
            {child.full_name}
          </span>
        </p>
      </div>

      {/* النموذج */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <ChildForm
          mode="edit"
          child={child}
          families={families ?? []}
          caregiverTypes={caregiverTypes ?? []}
        />
      </div>

    </div>
  );
}