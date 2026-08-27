import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RelationshipForm from "./relationship-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewRelationshipPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, full_name")
    .eq("id", id)
    .single();

  if (childError || !child) {
    notFound();
  }

  const [
    { data: relationshipTypes, error: relationshipTypesError },
    { data: children, error: childrenError },
  ] = await Promise.all([
    supabase
      .from("relationship_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("children")
      .select("id, full_name")
      .neq("id", id)
      .eq("status", "active")
      .order("full_name"),
  ]);

  if (relationshipTypesError || childrenError) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-800">
            حدث خطأ أثناء تحميل البيانات
          </h1>

          <p className="mt-2 text-sm text-red-600">
            يرجى المحاولة مرة أخرى.
          </p>

          <Link
            href={"/children/" + child.id}
            className="mt-4 inline-flex text-sm font-medium text-[#1e3a5f] hover:underline"
          >
            العودة إلى ملف الطفل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* العودة */}
      <div>
        <Link
          href={"/children/" + child.id}
          className="text-sm text-slate-500 transition hover:text-[#1e3a5f]"
        >
          العودة إلى ملف الطفل
        </Link>
      </div>

      {/* العنوان */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          إضافة علاقة
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          إضافة قريب أو شخص مرتبط بالطفل{" "}
          <span className="font-medium text-slate-700">
            {child.full_name}
          </span>
        </p>
      </div>

      {/* النموذج */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <RelationshipForm
          childId={child.id}
          relationshipTypes={relationshipTypes ?? []}
          children={children ?? []}
        />
      </div>

    </div>
  );
}