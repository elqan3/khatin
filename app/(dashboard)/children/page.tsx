import { createClient } from "@/lib/supabase/server";
import ChildrenList from "./children-list";

export default async function ChildrenPage() {
  const supabase = await createClient();

  const { data: children, error } = await supabase
    .from("children")
    .select(`
      id,
      full_name,
      date_of_birth,
      gender,
      nationality,
      status,
      families (
        id,
        family_name
      )
    `)
    .order("full_name");

  if (error) {
    console.error("Failed to load children:", error);

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="font-semibold text-red-800">
          حدث خطأ أثناء تحميل الأطفال
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {error.message}
        </p>
      </div>
    );
  }

  const formattedChildren =
    (children ?? []).map((child) => ({
      ...child,
      families: Array.isArray(child.families)
        ? child.families[0] ?? null
        : child.families,
    }));

  return (
    <ChildrenList
      children={formattedChildren}
    />
  );
}