-- Align bulk child import with the institution workbook.
-- Only the "الأطفال" worksheet is parsed by the application; this RPC accepts
-- year-only birth data and stores the institution's family number verbatim.

create or replace function public.import_children_bulk(p_rows jsonb)
returns table(inserted_count integer, skipped_count integer, error_count integer, errors jsonb)
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  current_user_id uuid := auth.uid();
  row_data jsonb;
  row_number integer;
  v_full_name text;
  v_birth_year integer;
  v_mother_name text;
  v_residence text;
  v_family_number text;
  v_notes text;
  v_inserted integer := 0;
  v_skipped integer := 0;
  v_error_count integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_existing_id uuid;
begin
  if current_user_id is null then raise exception 'جلسة المستخدم غير موجودة.'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = current_user_id and p.is_active = true
      and p.role in ('admin', 'manager', 'staff')
  ) then raise exception 'ليس لديك صلاحية استيراد الأطفال.'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'صيغة بيانات الاستيراد غير صحيحة.'; end if;

  for row_data in select value from jsonb_array_elements(p_rows)
  loop
    row_number := coalesce(nullif(row_data->>'rowNumber','')::integer, 0);
    v_full_name := nullif(trim(coalesce(row_data->>'full_name','')), '');
    v_mother_name := nullif(trim(coalesce(row_data->>'mother_name','')), '');
    v_residence := nullif(trim(coalesce(row_data->>'residence','')), '');
    v_family_number := nullif(trim(coalesce(row_data->>'family_number','')), '');
    v_notes := nullif(trim(coalesce(row_data->>'notes','')), '');
    begin
      v_birth_year := nullif(trim(coalesce(row_data->>'birth_year','')), '')::integer;
    exception when others then v_birth_year := null;
    end;

    if v_full_name is null or v_mother_name is null or v_residence is null
       or v_family_number is null or v_birth_year is null
       or v_birth_year < 1900 or v_birth_year > extract(year from current_date)::integer then
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object('row', row_number,
        'message', 'الاسم وسنة الميلاد واسم الأم والسكن ورقم العائلة حقول مطلوبة، وسنة الميلاد يجب أن تكون صحيحة.');
      continue;
    end if;

    select c.id into v_existing_id from public.children c
    where lower(trim(c.full_name)) = lower(v_full_name)
      and c.birth_year = v_birth_year
      and coalesce(c.family_number, '') = v_family_number limit 1;
    if v_existing_id is not null then v_skipped := v_skipped + 1; continue; end if;

    begin
      insert into public.children (full_name,birth_year,date_of_birth,gender,mother_name,residence,family_number,notes,status)
      values (v_full_name,v_birth_year,null,null,v_mother_name,v_residence,v_family_number,v_notes,'active');
      v_inserted := v_inserted + 1;
    exception when others then
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object('row', row_number, 'message', sqlerrm);
    end;
  end loop;
  return query select v_inserted,v_skipped,v_error_count,v_errors;
end;
$function$;

revoke all on function public.import_children_bulk(jsonb) from public;
revoke all on function public.import_children_bulk(jsonb) from anon;
grant execute on function public.import_children_bulk(jsonb) to authenticated;
