"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

type ImportRow = {
  rowNumber: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  mother_name: string;
  guardian_name: string;
  phone: string;
  phone_owner: string;
  family_name: string;
  notes: string;
};

type ImportResult = {
  inserted_count: number;
  skipped_count: number;
  error_count: number;
  errors: {
    row: number;
    message: string;
  }[];
};

const REQUIRED_COLUMNS = [
  "الاسم الكامل",
  "تاريخ الميلاد",
  "الجنس",
  "الجنسية",
  "اسم الأم",
  "اسم الحاضن",
  "رقم الهاتف",
  "الهاتف لمن؟",
  "العائلة",
  "ملاحظات",
];

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeDate(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "number") {
    const parsedDate = XLSX.SSF.parse_date_code(value);

    if (parsedDate) {
      const month = String(parsedDate.m).padStart(2, "0");
      const day = String(parsedDate.d).padStart(2, "0");

      return `${parsedDate.y}-${month}-${day}`;
    }
  }

  const text = String(value).trim();

  const match = text.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
  );

  if (match) {
    const [, year, month, day] = match;

    return `${year}-${String(month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
  }

  return text;
}

function downloadTemplate() {
  const headers = REQUIRED_COLUMNS;

  const exampleRow = [
    "أحمد محمد علي",
    "2015-03-12",
    "ذكر",
    "ليبي",
    "فاطمة محمد",
    "محمد علي",
    "0912345678",
    "الأب",
    "عائلة أحمد",
    "مثال فقط",
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    exampleRow,
  ]);

  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "الأطفال"
  );

  XLSX.writeFile(
    workbook,
    "khatin-children-template.xlsx"
  );
}

export default function ChildrenImportPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoading(true);
    setFileName(file.name);
    setRows([]);
    setErrors([]);
    setSuccessMessage("");
    setImportResult(null);

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase();

      if (
        extension !== "xlsx" &&
        extension !== "csv"
      ) {
        throw new Error(
          "نوع الملف غير مدعوم. استخدم XLSX أو CSV."
        );
      }

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      if (workbook.SheetNames.length === 0) {
        throw new Error(
          "الملف لا يحتوي على أي ورقة بيانات."
        );
      }

      const firstSheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[firstSheetName];

      const rawRows =
        XLSX.utils.sheet_to_json<
          Record<string, unknown>
        >(worksheet, {
          defval: "",
          raw: true,
        });

      if (rawRows.length === 0) {
        throw new Error(
          "الملف لا يحتوي على سجلات."
        );
      }

      const firstRow = rawRows[0];

      const availableColumns = Object.keys(
        firstRow
      ).map((column) => column.trim());

      const missingColumns =
        REQUIRED_COLUMNS.filter(
          (column) =>
            !availableColumns.includes(column)
        );

      if (missingColumns.length > 0) {
        throw new Error(
          `الأعمدة التالية مفقودة: ${missingColumns.join(
            "، "
          )}`
        );
      }

      const parsedRows: ImportRow[] = [];
      const validationErrors: string[] = [];

      rawRows.forEach((rawRow, index) => {
        const rowNumber = index + 2;

        const parsedRow: ImportRow = {
          rowNumber,
          full_name: normalizeValue(
            rawRow["الاسم الكامل"]
          ),
          date_of_birth: normalizeDate(
            rawRow["تاريخ الميلاد"]
          ),
          gender: normalizeValue(
            rawRow["الجنس"]
          ),
          nationality:
            normalizeValue(
              rawRow["الجنسية"]
            ) || "ليبي",
          mother_name: normalizeValue(
            rawRow["اسم الأم"]
          ),
          guardian_name:
            normalizeValue(
              rawRow["اسم الحاضن"]
            ),
          phone: normalizeValue(
            rawRow["رقم الهاتف"]
          ),
          phone_owner: normalizeValue(
            rawRow["الهاتف لمن؟"]
          ),
          family_name: normalizeValue(
            rawRow["العائلة"]
          ),
          notes: normalizeValue(
            rawRow["ملاحظات"]
          ),
        };

        if (!parsedRow.full_name) {
          validationErrors.push(
            `السطر ${rowNumber}: اسم الطفل فارغ.`
          );
        }

        if (!parsedRow.date_of_birth) {
          validationErrors.push(
            `السطر ${rowNumber}: تاريخ الميلاد فارغ.`
          );
        }

        if (
          parsedRow.gender !== "ذكر" &&
          parsedRow.gender !== "أنثى" &&
          parsedRow.gender !== "male" &&
          parsedRow.gender !== "female"
        ) {
          validationErrors.push(
            `السطر ${rowNumber}: الجنس يجب أن يكون "ذكر" أو "أنثى".`
          );
        }

        parsedRows.push(parsedRow);
      });

      setRows(parsedRows);
      setErrors(validationErrors);

      if (validationErrors.length === 0) {
        setSuccessMessage(
          `تمت قراءة ${parsedRows.length} سجلًا بنجاح، وجميع السجلات الأساسية تبدو صحيحة.`
        );
      }
    } catch (error) {
      console.error(
        "Failed to read import file:",
        error
      );

      setErrors([
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء قراءة الملف.",
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    const { data: debugData, error: debugError } =
  await supabase.rpc("debug_import_auth");

console.log("========== KHATIN SERVER AUTH DEBUG ==========");
console.log("Debug data:", debugData);
console.log("Debug error:", debugError);
console.log("===============================================");
    if (rows.length === 0) {
      return;
    }

    if (errors.length > 0) {
      return;
    }

    setImporting(true);
    setSuccessMessage("");
    setImportResult(null);

    try {
        
        const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("========== KHATIN AUTH DEBUG ==========");
  console.log("User:", user);
  console.log("User ID:", user?.id);
  console.log("User Email:", user?.email);
  console.log("Auth Error:", userError);
  console.log("========================================");

      const payload = rows.map((row) => ({
        rowNumber: row.rowNumber,
        full_name: row.full_name,
        date_of_birth: row.date_of_birth,
        gender: row.gender,
        nationality: row.nationality,
        mother_name: row.mother_name,
        guardian_name: row.guardian_name,
        phone: row.phone,
        phone_owner: row.phone_owner,
        family_name: row.family_name,
        notes: row.notes,
      }));

      const { data, error } =
        await supabase.rpc(
          "import_children_bulk",
          {
            p_rows: payload,
          }
        );

     if (error) {
  console.error("Supabase import error:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(
    error.message ||
      error.details ||
      error.hint ||
      "فشل استيراد الأطفال من قاعدة البيانات."
  );
}
     const row = Array.isArray(data) ? data[0] : data;

if (!row) {
  throw new Error("لم تُرجع قاعدة البيانات نتيجة الاستيراد.");
}

const result = Array.isArray(data) ? data[0] : data;

setImportResult({
  inserted_count: result?.inserted_count ?? 0,
  skipped_count: result?.skipped_count ?? 0,
  error_count: result?.error_count ?? 0,
  errors: Array.isArray(result?.errors) ? result.errors : [],
});

      if (result.error_count === 0) {
        setSuccessMessage(
          `تم استيراد ${result.inserted_count} طفل بنجاح.`
        );

        /*
         * نحدّث بيانات صفحة الأطفال بعد الاستيراد.
         */
        router.refresh();
      } else {
        setSuccessMessage(
          "انتهت عملية الاستيراد مع وجود بعض الأخطاء."
        );
      }
    } catch (error) {
      console.error(
        "Failed to import children:",
        error
      );

      setErrors([
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء استيراد الأطفال.",
      ]);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/children"
          className="text-sm text-slate-500 transition hover:text-[#1e3a5f]"
        >
          العودة إلى الأطفال
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-slate-900">
            استيراد الأطفال
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            استيراد عدد كبير من الأطفال دفعة واحدة من ملف
            Excel أو CSV.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              1. تجهيز الملف
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              استخدم القالب الجاهز وأدخل بيانات الأطفال في
              الأعمدة المحددة، ثم ارفع الملف هنا.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            📥 تحميل قالب Excel
          </button>

        </div>

      </section>

      {/* Upload */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-900">
          2. رفع الملف
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          الصيغ المدعومة: XLSX و CSV
        </p>

        <label
          htmlFor="children-file"
          className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-[#1e3a5f] hover:bg-slate-100"
        >

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
            📄
          </div>

          <p className="mt-4 font-medium text-slate-800">
            اختر ملف Excel أو CSV
          </p>

          <p className="mt-1 text-xs text-slate-500">
            يمكنك رفع ملف يحتوي على مئات الأطفال
          </p>

          <span className="mt-5 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white">
            اختيار الملف
          </span>

          <input
            id="children-file"
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

        </label>

        {fileName && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            الملف المحدد:
            <span className="mr-1 font-medium text-slate-900">
              {fileName}
            </span>
          </div>
        )}

      </section>

      {/* Loading */}
      {(loading || importing) && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <div className="flex items-center gap-3">

            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />

            <p className="text-sm font-medium text-blue-800">
              {importing
                ? "جارٍ استيراد الأطفال إلى قاعدة البيانات..."
                : "جارٍ قراءة الملف والتحقق من البيانات..."}
            </p>

          </div>

        </section>
      )}

      {/* Errors */}
      {errors.length > 0 && !loading && !importing && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <h2 className="font-semibold text-red-800">
            توجد مشاكل تحتاج إلى تصحيح
          </h2>

          <p className="mt-1 text-sm text-red-700">
            لن يتم استيراد أي بيانات قبل معالجة الأخطاء.
          </p>

          <div className="mt-4 max-h-72 space-y-2 overflow-auto">

            {errors.map((error, index) => (
              <div
                key={`${error}-${index}`}
                className="rounded-lg bg-white px-4 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            ))}

          </div>

        </section>
      )}

      {/* Success */}
      {successMessage &&
        !loading &&
        !importing && (
          <section className="rounded-2xl border border-green-200 bg-green-50 p-5">

            <p className="text-sm font-medium text-green-800">
              ✅ {successMessage}
            </p>

          </section>
        )}

      {/* Import Result */}
      {importResult &&
        !loading &&
        !importing && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              نتيجة الاستيراد
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">

              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-xs font-medium text-green-700">
                  تم الإدخال
                </p>

                <p className="mt-2 text-2xl font-bold text-green-700">
                  {importResult.inserted_count}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-700">
                  تم تجاوزها
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-700">
                  {importResult.skipped_count}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs font-medium text-red-700">
                  أخطاء
                </p>

                <p className="mt-2 text-2xl font-bold text-red-700">
                  {importResult.error_count}
                </p>
              </div>

            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-5 space-y-2">

                <h3 className="text-sm font-semibold text-slate-800">
                  تفاصيل الأخطاء
                </h3>

                <div className="max-h-72 space-y-2 overflow-auto">

                  {importResult.errors.map(
                    (error, index) => (
                      <div
                        key={`${error.row}-${index}`}
                        className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        السطر {error.row}:{" "}
                        {error.message}
                      </div>
                    )
                  )}

                </div>

              </div>
            )}

          </section>
        )}

      {/* Preview */}
      {rows.length > 0 &&
        !loading &&
        !importing && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  3. معاينة البيانات
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  عدد السجلات المقروءة:{" "}
                  <span className="font-semibold text-slate-900">
                    {rows.length}
                  </span>
                </p>
              </div>

              <button
                type="button"
                disabled={
                  errors.length > 0 ||
                  importing
                }
                onClick={handleImport}
                className="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#16304f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                🚀 استيراد {rows.length} طفل
              </button>

            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full text-right text-sm">

                <thead className="bg-slate-50 text-xs text-slate-500">

                  <tr>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      السطر
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      الاسم الكامل
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      تاريخ الميلاد
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      الجنس
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      الجنسية
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      اسم الأم
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      الهاتف
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      العائلة
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {rows.slice(0, 10).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className="hover:bg-slate-50"
                    >

                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                        {row.rowNumber}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {row.full_name || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row.date_of_birth || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row.gender || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row.nationality || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row.mother_name || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row.phone || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row.family_name || "—"}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

            {rows.length > 10 && (
              <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
                يتم عرض أول 10 سجلات فقط في المعاينة.
                سيتم التعامل مع جميع السجلات عند تنفيذ
                الاستيراد.
              </div>
            )}

          </section>
        )}

    </div>
  );
}
