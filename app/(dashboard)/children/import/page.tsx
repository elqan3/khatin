"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

type Row = { rowNumber:number; full_name:string; birth_year:number; mother_name:string; residence:string; family_number:string; notes:string };
type Result = { inserted_count:number; skipped_count:number; error_count:number; errors:{row:number;message:string}[] };
const REQUIRED = ["الاسم الكامل","تاريخ الميلاد","اسم الأم","السكن","العائلة"];
const str = (v:unknown) => v == null ? "" : String(v).trim();
function yearOf(v:unknown):number {
 const s=str(v); const m=s.match(/^(\d{4})(?:[-/.]\d{1,2}(?:[-/.]\d{1,2})?)?$/);
 if(!m) return 0; const y=Number(m[1]); return y>=1900 && y<=new Date().getFullYear()?y:0;
}
function downloadTemplate(){
 const ws=XLSX.utils.aoa_to_sheet([["الاسم الكامل","تاريخ الميلاد","الجنس","الجنسية","اسم الأم","السكن","اسم الحاضن","رقم الهاتف","الهاتف لمن؟","العائلة","ملاحظات"],["أحمد محمد علي","2015","","","فاطمة محمد","طرابلس","","","","1",""]]);
 const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"الأطفال"); XLSX.writeFile(wb,"khatin-children-template.xlsx");
}
export default function ChildrenImportPage(){
 const router=useRouter(); const supabase=createClient();
 const [fileName,setFileName]=useState(""); const [rows,setRows]=useState<Row[]>([]);
 const [errors,setErrors]=useState<string[]>([]); const [loading,setLoading]=useState(false);
 const [importing,setImporting]=useState(false); const [result,setResult]=useState<Result|null>(null);
 const [message,setMessage]=useState("");
 async function handleFileChange(e:React.ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0]; if(!file)return;
  setLoading(true);setFileName(file.name);setRows([]);setErrors([]);setResult(null);setMessage("");
  try{
   const ext=file.name.split(".").pop()?.toLowerCase(); if(ext!=="xlsx"&&ext!=="csv")throw new Error("ارفع ملف XLSX أو CSV فقط.");
   const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:false});
   const sheetName=wb.SheetNames.includes("الأطفال")?"الأطفال":wb.SheetNames[0]; if(!sheetName)throw new Error("الملف لا يحتوي على ورقة بيانات.");
   const raw=XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[sheetName],{defval:"",raw:false});
   if(!raw.length)throw new Error("ورقة الأطفال فارغة.");
   const cols=Object.keys(raw[0]).map(x=>x.trim());const missing=REQUIRED.filter(x=>!cols.includes(x));
   if(missing.length)throw new Error("الأعمدة المطلوبة غير موجودة: "+missing.join("، "));
   const issues:string[]=[];const parsed:Row[]=raw.map((r,i)=>{
    const row:Row={rowNumber:i+2,full_name:str(r["الاسم الكامل"]),birth_year:yearOf(r["تاريخ الميلاد"]),mother_name:str(r["اسم الأم"]),residence:str(r["السكن"]),family_number:str(r["العائلة"]),notes:str(r["ملاحظات"])};
    if(!row.full_name)issues.push(`السطر ${row.rowNumber}: الاسم الكامل فارغ.`);
    if(!row.birth_year)issues.push(`السطر ${row.rowNumber}: سنة الميلاد غير صحيحة.`);
    if(!row.mother_name)issues.push(`السطر ${row.rowNumber}: اسم الأم فارغ.`);
    if(!row.residence)issues.push(`السطر ${row.rowNumber}: السكن فارغ.`);
    if(!row.family_number)issues.push(`السطر ${row.rowNumber}: رقم العائلة فارغ.`);
    return row;
   });
   const seen=new Set<string>();for(const r of parsed){const k=[r.full_name.toLocaleLowerCase(),r.birth_year,r.family_number].join("|");if(seen.has(k))issues.push(`السطر ${r.rowNumber}: سجل مكرر داخل الملف.`);seen.add(k);}
   setRows(parsed);setErrors(issues);if(!issues.length)setMessage(`تمت قراءة ${parsed.length} سجلًا من ورقة «${sheetName}». لم تُدخل البيانات بعد.`);
  }catch(err){setErrors([err instanceof Error?err.message:"تعذرت قراءة الملف."]);}finally{setLoading(false);}
 }
 async function handleImport(){
  if(!rows.length||errors.length||importing)return;
  if(!window.confirm(`سيتم استيراد ${rows.length} سجلًا. هل تريد المتابعة؟`))return;
  setImporting(true);setResult(null);setMessage("");
  try{
   const payload=rows.map(({rowNumber,full_name,birth_year,mother_name,residence,family_number,notes})=>({rowNumber,full_name,birth_year,mother_name,residence,family_number,notes}));
   const {data,error}=await supabase.rpc("import_children_bulk",{p_rows:payload});if(error)throw new Error(error.message);
   const item=Array.isArray(data)?data[0]:data;if(!item)throw new Error("لم تُرجع قاعدة البيانات نتيجة.");
   setResult({inserted_count:Number(item.inserted_count??0),skipped_count:Number(item.skipped_count??0),error_count:Number(item.error_count??0),errors:Array.isArray(item.errors)?item.errors:[]});
   setMessage("انتهت عملية الاستيراد.");router.refresh();
  }catch(err){setErrors([err instanceof Error?err.message:"فشل الاستيراد."]);}finally{setImporting(false);}
 }
 return <div className="mx-auto max-w-6xl space-y-6">
  <div><Link href="/children" className="text-sm text-slate-500">العودة إلى الأطفال</Link><h1 className="mt-4 text-2xl font-bold">استيراد الأطفال</h1><p className="mt-1 text-sm text-slate-500">يدعم ملف المؤسسة ويقرأ ورقة «الأطفال» فقط، ويتجاهل ورقة المراجعة.</p></div>
  <section className="rounded-2xl border bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">قالب الاستيراد</h2><p className="mt-1 text-sm text-slate-500">الاسم، سنة الميلاد، اسم الأم، السكن، رقم العائلة.</p></div><button onClick={downloadTemplate} className="rounded-xl border px-5 py-3 text-sm">تحميل قالب Excel</button></div></section>
  <section className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">رفع ملف المؤسسة</h2><p className="mt-1 text-sm text-slate-500">XLSX أو CSV</p><label htmlFor="children-file" className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-slate-50 p-10"><span className="text-3xl">📄</span><span className="mt-3">اختر ملف Excel أو CSV</span><span className="mt-4 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-white">اختيار الملف</span><input id="children-file" type="file" accept=".xlsx,.csv" onChange={handleFileChange} className="hidden"/></label>{fileName&&<p className="mt-3 text-sm">الملف: {fileName}</p>}</section>
  {(loading||importing)&&<p className="rounded-xl bg-blue-50 p-4 text-blue-800">{loading?"جارٍ قراءة الملف...":"جارٍ استيراد الأطفال..."}</p>}
  {!!errors.length&&!loading&&!importing&&<section className="rounded-xl border border-red-200 bg-red-50 p-5"><h2 className="font-semibold text-red-800">مشكلات تحتاج إلى تصحيح</h2><ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm text-red-700">{errors.map((x,i)=><li key={i}>{x}</li>)}</ul></section>}
  {message&&!loading&&!importing&&<p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
  {!!rows.length&&!loading&&<section className="overflow-hidden rounded-2xl border bg-white"><div className="flex flex-wrap items-center justify-between gap-4 border-b p-5"><div><h2 className="font-semibold">معاينة البيانات</h2><p className="text-sm text-slate-500">عدد السجلات: {rows.length} — أول 12 سجلًا</p></div><button disabled={!!errors.length||importing} onClick={handleImport} className="rounded-xl bg-[#1e3a5f] px-5 py-3 text-white disabled:opacity-40">استيراد {rows.length} سجلًا</button></div>
  <div className="overflow-x-auto"><table className="min-w-full text-right text-sm"><thead className="bg-slate-50"><tr>{["السطر","الاسم الكامل","سنة الميلاد","اسم الأم","السكن","رقم العائلة"].map(x=><th key={x} className="whitespace-nowrap px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y">{rows.slice(0,12).map(r=><tr key={r.rowNumber}><td className="px-4 py-3">{r.rowNumber}</td><td className="whitespace-nowrap px-4 py-3">{r.full_name}</td><td className="px-4 py-3">{r.birth_year||"—"}</td><td className="whitespace-nowrap px-4 py-3">{r.mother_name||"—"}</td><td className="px-4 py-3">{r.residence||"—"}</td><td className="px-4 py-3">{r.family_number||"—"}</td></tr>)}</tbody></table></div>
  {result&&<div className="grid gap-3 border-t p-5 sm:grid-cols-3"><p className="rounded-lg bg-green-50 p-3 text-green-800">تم الإدخال: {result.inserted_count}</p><p className="rounded-lg bg-amber-50 p-3 text-amber-800">تم التجاوز: {result.skipped_count}</p><p className="rounded-lg bg-red-50 p-3 text-red-800">الأخطاء: {result.error_count}</p>{result.errors.map((x,i)=><p key={i} className="sm:col-span-3 text-sm text-red-700">السطر {x.row}: {x.message}</p>)}</div>}</section>}
 </div>;
}
