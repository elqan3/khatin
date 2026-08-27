import Link from "next/link";
import ChildForm from "@/components/children/child-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewChildPage() {
  const supabase = await createClient();

  const [{ data: families }, { data: caregiverTypes }] =
    await Promise.all([
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/children"
          className="text-sm text-slate-500 hover:text-[#1e3a5f]"
        >
          ← العودة إلى الأطفال
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          إضافة طفل
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          إضافة طفل جديد إلى قاعدة بيانات مؤسسة كهاتين
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <ChildForm
          families={families ?? []}
          caregiverTypes={caregiverTypes ?? []}
        />
      </div>
    </div>
  );
}