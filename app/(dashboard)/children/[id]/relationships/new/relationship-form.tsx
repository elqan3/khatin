"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RelationshipType = {
  id: string;
  name: string;
};

type Child = {
  id: string;
  full_name: string;
};

type RelationshipFormProps = {
  childId: string;
  relationshipTypes: RelationshipType[];
  children: Child[];
};

export default function RelationshipForm({
  childId,
  relationshipTypes,
  children,
}: RelationshipFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [relationshipTypeId, setRelationshipTypeId] = useState("");
  const [personType, setPersonType] = useState<"child" | "external">(
    "child"
  );

  const [relatedChildId, setRelatedChildId] = useState("");
  const [relativeName, setRelativeName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!relationshipTypeId) {
      setError("يرجى اختيار نوع العلاقة.");
      return;
    }

    if (personType === "child" && !relatedChildId) {
      setError("يرجى اختيار الطفل المرتبط.");
      return;
    }

    if (personType === "external" && !relativeName.trim()) {
      setError("يرجى إدخال اسم الشخص.");
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from("relationships")
        .insert({
          child_id: childId,
          related_child_id:
            personType === "child"
              ? relatedChildId
              : null,
          relative_name:
            personType === "external"
              ? relativeName.trim()
              : null,
          phone:
            personType === "external"
              ? phone.trim() || null
              : null,
          notes: notes.trim() || null,
          relationship_type_id: relationshipTypeId,
        });

      if (insertError) {
        throw insertError;
      }

      router.push("/children/" + childId);
      router.refresh();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message || "حدث خطأ أثناء حفظ العلاقة."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* نوع العلاقة */}
      <div>
        <label
          htmlFor="relationship_type_id"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          نوع العلاقة
        </label>

        <select
          id="relationship_type_id"
          value={relationshipTypeId}
          onChange={(e) =>
            setRelationshipTypeId(e.target.value)
          }
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1e3a5f] disabled:bg-slate-50"
        >
          <option value="">
            اختر نوع العلاقة
          </option>

          {relationshipTypes.map((type) => (
            <option
              key={type.id}
              value={type.id}
            >
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* نوع الشخص */}
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">
          الشخص المرتبط
        </label>

        <div className="grid gap-3 sm:grid-cols-2">

          <button
            type="button"
            onClick={() => {
              setPersonType("child");
              setRelativeName("");
              setPhone("");
            }}
            disabled={loading}
            className={
              personType === "child"
                ? "rounded-xl border-2 border-[#1e3a5f] bg-slate-50 p-4 text-right"
                : "rounded-xl border border-slate-200 bg-white p-4 text-right hover:bg-slate-50"
            }
          >
            <p className="text-sm font-medium text-slate-800">
              طفل مسجل
            </p>

            <p className="mt-1 text-xs text-slate-500">
              طفل آخر مسجل في المؤسسة
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setPersonType("external");
              setRelatedChildId("");
            }}
            disabled={loading}
            className={
              personType === "external"
                ? "rounded-xl border-2 border-[#1e3a5f] bg-slate-50 p-4 text-right"
                : "rounded-xl border border-slate-200 bg-white p-4 text-right hover:bg-slate-50"
            }
          >
            <p className="text-sm font-medium text-slate-800">
              شخص خارج المؤسسة
            </p>

            <p className="mt-1 text-xs text-slate-500">
              قريب أو شخص غير مسجل كطفل
            </p>
          </button>

        </div>
      </div>

      {/* طفل مسجل */}
      {personType === "child" && (
        <div>
          <label
            htmlFor="related_child_id"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            اختر الطفل
          </label>

          <select
            id="related_child_id"
            value={relatedChildId}
            onChange={(e) =>
              setRelatedChildId(e.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1e3a5f] disabled:bg-slate-50"
          >
            <option value="">
              اختر الطفل المرتبط
            </option>

            {children.map((otherChild) => (
              <option
                key={otherChild.id}
                value={otherChild.id}
              >
                {otherChild.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* شخص خارجي */}
      {personType === "external" && (
        <div className="rounded-xl bg-slate-50 p-5">

          <h2 className="text-base font-semibold text-slate-900">
            بيانات الشخص
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <label
                htmlFor="relative_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                اسم الشخص
              </label>

              <input
                id="relative_name"
                type="text"
                value={relativeName}
                onChange={(e) =>
                  setRelativeName(e.target.value)
                }
                placeholder="مثال: محمد أحمد"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1e3a5f] disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                رقم الهاتف
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="09xxxxxxxx"
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1e3a5f] disabled:bg-slate-100"
              />
            </div>

          </div>
        </div>
      )}

      {/* الملاحظات */}
      <div>
        <label
          htmlFor="notes"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          ملاحظات
        </label>

        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="أي معلومات إضافية عن العلاقة..."
          disabled={loading}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#1e3a5f] disabled:bg-slate-50"
        />
      </div>

      {/* الخطأ */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* الأزرار */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={() =>
            router.push("/children/" + childId)
          }
          disabled={loading}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          إلغاء
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#16304f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "جاري الحفظ..." : "حفظ العلاقة"}
        </button>

      </div>
    </form>
  );
}