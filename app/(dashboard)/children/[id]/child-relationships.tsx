"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Relationship = {
  id: string;
  relative_name: string | null;
  phone: string | null;
  notes: string | null;
  relationship_type_id: string | null;
  related_child_id: string | null;

  relationship_types:
    | {
        id: string;
        name: string;
      }
    | null;

  related_child:
    | {
        id: string;
        full_name: string;
        date_of_birth: string;
        gender: string;
      }
    | null;
};

type ChildRelationshipsProps = {
  childId: string;
  relationships: Relationship[];
};

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth);
  const today = new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const monthDifference =
    today.getMonth() -
    birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

export default function ChildRelationships({
  childId,
  relationships: initialRelationships,
}: ChildRelationshipsProps) {
  const supabase = createClient();

  const [relationships, setRelationships] =
    useState(initialRelationships);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  async function handleDelete(
    relationshipId: string
  ) {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذه العلاقة؟\n\nلا يمكن التراجع عن هذه العملية."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(relationshipId);

    try {
      const { error: deleteError } =
        await supabase
          .from("relationships")
          .delete()
          .eq("id", relationshipId);

      if (deleteError) {
        throw deleteError;
      }

      setRelationships((current) =>
        current.filter(
          (relationship) =>
            relationship.id !== relationshipId
        )
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "حدث خطأ أثناء حذف العلاقة."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              الأقارب والعلاقات
            </h2>

            {relationships.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {relationships.length}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            الأشخاص المرتبطون بالطفل وعلاقته بهم
          </p>
        </div>

        <Link
          href={`/children/${childId}/relationships/new`}
          className="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#16304f]"
        >
          + إضافة علاقة
        </Link>

      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {relationships.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            👨‍👩‍👧
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-800">
            لا توجد علاقات مسجلة
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            يمكنك إضافة أخ أو أخت أو أحد الأقارب أو أي شخص
            مرتبط بالطفل.
          </p>

          <Link
            href={`/children/${childId}/relationships/new`}
            className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            إضافة أول علاقة
          </Link>

        </div>
      ) : (
        <div className="mt-6 space-y-3">

          {relationships.map((relationship) => {
            const relatedChild =
              relationship.related_child;

            const relationshipName =
              relationship.relationship_types?.name ||
              "غير محدد";

            const isDeleting =
              deletingId === relationship.id;

            return (
              <div
                key={relationship.id}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  {/* Person */}
                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                      {relatedChild
                        ? relatedChild.gender ===
                          "male"
                          ? "👦"
                          : "👧"
                        : "👤"}
                    </div>

                    <div className="min-w-0">

                      {relatedChild ? (
                        <Link
                          href={`/children/${relatedChild.id}`}
                          className="block truncate text-sm font-semibold text-slate-900 hover:text-[#1e3a5f] hover:underline"
                        >
                          {relatedChild.full_name}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {relationship.relative_name ||
                            "شخص غير محدد"}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-500">
                        {relationshipName}

                        {relatedChild
                          ? ` • ${calculateAge(
                              relatedChild.date_of_birth
                            )} سنة`
                          : null}
                      </p>

                    </div>
                  </div>

                  {/* Contact + Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">

                    {relatedChild ? (
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        طفل مسجل
                      </span>
                    ) : relationship.phone ? (
                      <a
                        href={`tel:${relationship.phone}`}
                        className="text-sm font-medium text-[#1e3a5f] hover:underline"
                      >
                        {relationship.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">
                        لا يوجد رقم هاتف
                      </span>
                    )}

                    {/* Edit */}
                    <Link
  href={`/children/${childId}/relationships/${relationship.id}`}
  onClick={(e) =>
    e.stopPropagation()
  }
  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
>
  تعديل
</Link>

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() =>
                        handleDelete(
                          relationship.id
                        )
                      }
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting
                        ? "جاري الحذف..."
                        : "حذف"}
                    </button>

                  </div>
                </div>

                {/* Notes */}
                {relationship.notes ? (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs leading-6 text-slate-500">
                      {relationship.notes}
                    </p>
                  </div>
                ) : null}

              </div>
            );
          })}

        </div>
      )}

    </section>
  );
}