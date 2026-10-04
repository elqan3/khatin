"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Family = {
  id: string;
  family_name: string;
};

type CaregiverType = {
  id: string;
  name: string;
};

type Child = {
  id: string;
  full_name: string;
  registration_number: string;
  date_of_birth: string;
  gender: "male" | "female";
  nationality: string | null;
  mother_name: string | null;
  guardian_name: string | null;
  phone: string | null;
  phone_owner: string | null;
  notes: string | null;
  status: "active" | "inactive";
  family_id: string | null;
  caregiver_type_id: string | null;
};

type ChildFormProps = {
  families: Family[];
  caregiverTypes: CaregiverType[];
  child?: Child;
  mode?: "create" | "edit";
};

export default function ChildForm({
  families,
  caregiverTypes,
  child,
  mode = "create",
}: ChildFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const isEditMode = mode === "edit" && !!child;

  const [fullName, setFullName] = useState(
    child?.full_name || ""
  );

  const [registrationNumber, setRegistrationNumber] = useState(
    child?.registration_number || "0000"
  );

  const [dateOfBirth, setDateOfBirth] = useState(
    child?.date_of_birth || ""
  );

  const [gender, setGender] = useState(
    child?.gender || ""
  );

  const [nationality, setNationality] = useState(
    child?.nationality || ""
  );

  const [motherName, setMotherName] = useState(
    child?.mother_name || ""
  );

  const [familyId, setFamilyId] = useState(
    child?.family_id || ""
  );

  const [newFamilyName, setNewFamilyName] =
    useState("");

  const [caregiverTypeId, setCaregiverTypeId] =
    useState(
      child?.caregiver_type_id || ""
    );

  const [caregiverName, setCaregiverName] =
    useState(
      child?.guardian_name || ""
    );

  const [phone, setPhone] = useState(
    child?.phone || ""
  );

  const [phoneOwner, setPhoneOwner] =
    useState(
      child?.phone_owner || ""
    );

  const [notes, setNotes] = useState(
    child?.notes || ""
  );

  const [status, setStatus] = useState<
    "active" | "inactive"
  >(
    child?.status || "active"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const creatingFamily =
    familyId === "__new__";

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!fullName.trim()) {
      setError("يرجى إدخال اسم الطفل.");
      return;
    }

    if (!dateOfBirth) {
      setError("يرجى إدخال تاريخ الميلاد.");
      return;
    }

    if (!gender) {
      setError("يرجى اختيار الجنس.");
      return;
    }


    setLoading(true);

    try {
      let selectedFamilyId = familyId;

      /*
       * إنشاء عائلة جديدة
       *
       * نسمح بذلك في الإضافة والتعديل.
       */
      if (creatingFamily && newFamilyName.trim()) {
        const { data: family, error: familyError } =
          await supabase
            .from("families")
            .insert({
              family_name:
                newFamilyName.trim(),
            })
            .select("id")
            .single();

        if (familyError) {
          throw familyError;
        }

        selectedFamilyId = family.id;
      } else if (creatingFamily) {
        selectedFamilyId = "";
      }

      const childData = {
        family_id: selectedFamilyId || null,
        full_name: fullName.trim(),
        registration_number: registrationNumber.trim() || "0000",
        date_of_birth: dateOfBirth,
        gender,
        nationality:
          nationality.trim() || null,
        mother_name:
          motherName.trim() || null,
        caregiver_type_id:
          caregiverTypeId || null,
        guardian_name:
          caregiverName.trim() || null,
        phone:
          phone.trim() || null,
        phone_owner:
          phone.trim() ? phoneOwner || null : null,
        notes:
          notes.trim() || null,
        status,
      };

      /*
       * وضع التعديل
       */
      if (isEditMode) {
        const { error: updateError } =
          await supabase
            .from("children")
            .update(childData)
            .eq("id", child.id);

        if (updateError) {
          throw updateError;
        }

        router.push(
          `/children/${child.id}`
        );

        router.refresh();

        return;
      }

      /*
       * وضع الإضافة
       */
      const { error: childError } =
        await supabase
          .from("children")
          .insert(childData);

      if (childError) {
        throw childError;
      }

      router.push("/children");
      router.refresh();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "حدث خطأ أثناء حفظ بيانات الطفل."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >

      {/* البيانات الأساسية */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          البيانات الأساسية
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          {/* الاسم */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              الاسم الكامل
            </label>

            <input
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              placeholder="مثال: أحمد محمد علي"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* رقم القيد */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              رقم القيد
            </label>

            <input
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="اتركه فارغًا للحفظ كـ 0000"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />

            <p className="mt-1 text-xs text-slate-400">
              يمكن أن يشترك أكثر من طفل في نفس رقم القيد.
            </p>
          </div>

          {/* تاريخ الميلاد */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              تاريخ الميلاد
            </label>

            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) =>
                setDateOfBirth(
                  e.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* الجنس */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              الجنس
            </label>

            <select
              value={gender}
              onChange={(e) =>
                setGender(e.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            >
              <option value="">
                اختر الجنس
              </option>

              <option value="male">
                ذكر
              </option>

              <option value="female">
                أنثى
              </option>
            </select>
          </div>

          {/* الجنسية */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              الجنسية
            </label>

            <input
              placeholder="اختياري"
              value={nationality}
              onChange={(e) =>
                setNationality(
                  e.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* اسم الأم */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              اسم الأم
            </label>

            <input
              value={motherName}
              onChange={(e) =>
                setMotherName(
                  e.target.value
                )
              }
              placeholder="اسم الأم"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

        </div>
      </section>

      {/* العائلة */}
      <section className="border-t border-slate-100 pt-8">

        <h2 className="text-lg font-semibold text-slate-900">
          العائلة
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          اربط الطفل بعائلة موجودة أو أنشئ عائلة جديدة.
        </p>

        <div className="mt-5">

          <label className="mb-2 block text-sm font-medium">
            العائلة
          </label>

          <select
            value={familyId}
            onChange={(e) =>
              setFamilyId(e.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
          >
            <option value="">
              بدون عائلة
            </option>

            {families.map((family) => (
              <option
                key={family.id}
                value={family.id}
              >
                {family.family_name}
              </option>
            ))}

            <option value="__new__">
              + إنشاء عائلة جديدة
            </option>
          </select>
        </div>

        {creatingFamily && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">

            <label className="mb-2 block text-sm font-medium">
              اسم العائلة الجديدة
            </label>

            <input
              value={newFamilyName}
              onChange={(e) =>
                setNewFamilyName(
                  e.target.value
                )
              }
              placeholder="مثال: عائلة محمد"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-100"
            />

          </div>
        )}

      </section>

      {/* الحاضن والتواصل */}
      <section className="border-t border-slate-100 pt-8">

        <h2 className="text-lg font-semibold text-slate-900">
          الحاضن والتواصل
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          {/* نوع الحاضن */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              نوع الحاضن <span className="text-xs font-normal text-slate-400">(اختياري)</span>
            </label>

            <select
              value={caregiverTypeId}
              onChange={(e) =>
                setCaregiverTypeId(
                  e.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            >
              <option value="">
                بدون تحديد
              </option>

              {caregiverTypes.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* اسم الحاضن */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              اسم الحاضن
            </label>

            <input
              value={caregiverName}
              onChange={(e) =>
                setCaregiverName(
                  e.target.value
                )
              }
              placeholder="اسم الحاضن"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* الهاتف */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              رقم الهاتف
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="09xxxxxxxx"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            />
          </div>

          {/* الهاتف لمن */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              الهاتف لمن؟
            </label>

            <select
              value={phoneOwner}
              onChange={(e) =>
                setPhoneOwner(
                  e.target.value
                )
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
            >
              <option value="">
                اختر صاحب الهاتف
              </option>

              <option value="mother">
                الأم
              </option>

              <option value="father">
                الأب
              </option>

              <option value="grandfather">
                الجد
              </option>

              <option value="grandmother">
                الجدة
              </option>

              <option value="uncle_paternal">
                العم
              </option>

              <option value="aunt_paternal">
                العمة
              </option>

              <option value="uncle_maternal">
                الخال
              </option>

              <option value="aunt_maternal">
                الخالة
              </option>

              <option value="guardian">
                الحاضن
              </option>

              <option value="other">
                أخرى
              </option>
            </select>
          </div>

        </div>
      </section>

      {/* الحالة */}
      <section className="border-t border-slate-100 pt-8">

        <h2 className="text-lg font-semibold text-slate-900">
          حالة الطفل
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          تحديد ما إذا كان الطفل نشطًا في المؤسسة.
        </p>

        <div className="mt-5">

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as
                  | "active"
                  | "inactive"
              )
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
          >
            <option value="active">
              نشط
            </option>

            <option value="inactive">
              غير نشط
            </option>
          </select>

        </div>
      </section>

      {/* الملاحظات */}
      <section className="border-t border-slate-100 pt-8">

        <label className="mb-2 block text-sm font-medium">
          ملاحظات
        </label>

        <textarea
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          rows={4}
          placeholder="أي معلومات إضافية..."
          disabled={loading}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50"
        />

      </section>

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
          onClick={() => {
            if (isEditMode && child) {
              router.push(
                `/children/${child.id}`
              );
            } else {
              router.push("/children");
            }
          }}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          إلغاء
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-medium text-white hover:bg-[#16304f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "جاري الحفظ..."
            : isEditMode
            ? "حفظ التعديلات"
            : "حفظ الطفل"}
        </button>

      </div>

    </form>
  );
}