"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Child = {
  id: string;
  full_name: string;
  registration_number?: string | null;
  date_of_birth?: string | null;
  birth_year?: number | null;
  gender?: "male" | "female" | null;
  nationality?: string | null;
  mother_name?: string | null;
  residence?: string | null;
  family_number?: string | null;
  guardian_name?: string | null;
  phone?: string | null;
  phone_owner?: string | null;
  notes?: string | null;
  status?: "active" | "inactive";
  family_id?: string | null;
  caregiver_type_id?: string | null;
};

type ChildFormProps = {
  families?: { id: string; family_name: string }[];
  caregiverTypes?: { id: string; name: string }[];
  child?: Child;
  mode?: "create" | "edit";
};

const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f] disabled:bg-slate-50";

export default function ChildForm({ child, mode = "create" }: ChildFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = mode === "edit" && !!child;
  const [fullName, setFullName] = useState(child?.full_name ?? "");
  const [birthYear, setBirthYear] = useState(String(child?.birth_year ?? (child?.date_of_birth ? child.date_of_birth.slice(0, 4) : "")));
  const [motherName, setMotherName] = useState(child?.mother_name ?? "");
  const [residence, setResidence] = useState(child?.residence ?? "");
  const [familyNumber, setFamilyNumber] = useState(child?.family_number ?? "");
  const [notes, setNotes] = useState(child?.notes ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(child?.status ?? "active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("يرجى إدخال الاسم الكامل.");
    if (!birthYear.trim()) return setError("يرجى إدخال سنة الميلاد.");
    if (!motherName.trim()) return setError("يرجى إدخال اسم الأم.");
    if (!residence.trim()) return setError("يرجى إدخال السكن.");
    if (!familyNumber.trim()) return setError("يرجى إدخال رقم العائلة.");
    const year = Number(birthYear);
    if (year !== null && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())) {
      return setError("يرجى إدخال سنة ميلاد صحيحة.");
    }
    setLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        birth_year: year,
        mother_name: motherName.trim() || null,
        residence: residence.trim() || null,
        family_number: familyNumber.trim() || null,
        notes: notes.trim() || null,
        status,
      };
      if (isEdit && child) {
        const { error } = await supabase.from("children").update(payload).eq("id", child.id);
        if (error) throw error;
        router.push(`/children/${child.id}`);
      } else {
        const { error } = await supabase.from("children").insert(payload);
        if (error) throw error;
        router.push("/children");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ بيانات الطفل.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">البيانات الأساسية</h2>
        <p className="mt-1 text-sm text-slate-500">الحقول الأساسية وفق سجل المؤسسة. الجنس غير مطلوب ولا يُشترط إدخاله.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2 block text-sm font-medium">الاسم الكامل
            <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="الاسم الكامل للطفل" disabled={loading} className={inputClass + " mt-2"} />
          </label>
          <label className="block text-sm font-medium">سنة الميلاد
            <input required type="number" min="1900" max={new Date().getFullYear()} step="1" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="مثال: 2017" disabled={loading} className={inputClass + " mt-2"} />
            <span className="mt-1 block text-xs font-normal text-slate-400">أدخل السنة فقط، دون اليوم أو الشهر.</span>
          </label>
          <label className="block text-sm font-medium">اسم الأم
            <input required value={motherName} onChange={e => setMotherName(e.target.value)} placeholder="اسم الأم" disabled={loading} className={inputClass + " mt-2"} />
          </label>
          <label className="block text-sm font-medium">السكن
            <input required value={residence} onChange={e => setResidence(e.target.value)} placeholder="المنطقة أو مكان السكن" disabled={loading} className={inputClass + " mt-2"} />
          </label>
          <label className="block text-sm font-medium">رقم العائلة
            <input required value={familyNumber} onChange={e => setFamilyNumber(e.target.value)} placeholder="رقم العائلة في سجل المؤسسة" disabled={loading} className={inputClass + " mt-2"} />
          </label>
        </div>
      </section>
      <section className="border-t border-slate-100 pt-6">
        <label className="block text-sm font-medium">حالة الطفل
          <select value={status} onChange={e => setStatus(e.target.value as "active" | "inactive")} disabled={loading} className={inputClass + " mt-2"}>
            <option value="active">نشط</option><option value="inactive">غير نشط</option>
          </select>
        </label>
      </section>
      <section className="border-t border-slate-100 pt-6">
        <label className="block text-sm font-medium">ملاحظات
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="أي معلومات إضافية..." disabled={loading} className={inputClass + " mt-2 resize-y"} />
        </label>
      </section>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => router.push(isEdit && child ? `/children/${child.id}` : "/children")} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600">إلغاء</button>
        <button type="submit" disabled={loading} className="rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-medium text-white disabled:opacity-60">{loading ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "حفظ الطفل"}</button>
      </div>
    </form>
  );
}
