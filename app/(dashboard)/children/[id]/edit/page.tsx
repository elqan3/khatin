import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChildForm from "@/components/children/child-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditChildPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // جلب بيانات الطفل
  const { data: child, error: childError } =
    await supabase
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
      .single();

  if (childError || !child) {
    notFound();
  }

  // جلب العائلات وأنواع الحاضنين
  const [
    { data: families, error: familiesError },
    { data: caregiverTypes, error: caregiverTypesError },
  ] = await Promise.all([
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

  if (familiesError || caregiverTypesError) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-800">
            حدث خطأ أثناء تحميل بيانات التعديل
          </h1>

          <p className="mt-2 text-sm text-red-600">
            يرجى المحاولة مرة أخرى.
          </p>

          <Link
            href={`/children/${id}`}
            className="mt-4 inline-flex text-sm font-medium text-[#1e3a5f] hover:underline"
          >
            العودة إلى ملف الطفل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* العودة */}
      <div>
        <Link
          href={`/children/${id}`}
          className="text-sm text-slate-500 transition hover:text-[#1e3a5f]"
        >
          ← العودة إلى ملف الطفل
        </Link>
      </div>

      {/* العنوان */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          تعديل بيانات الطفل
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          تعديل البيانات الخاصة بالطفل{" "}
          <span className="font-medium text-slate-700">
            {child.full_name}
          </span>
        </p>
      </div>

      {/* النموذج */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ChildForm
          families={families ?? []}
          caregiverTypes={caregiverTypes ?? []}
          child={child}
          mode="edit"
        />
      </div>

    </div>
  );
}