import PointsSettings from "@/components/points/points-settings";

export default function PointsPage() {
  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة النقاط</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          غيّر قيمة النقاط للعمليات الجديدة فقط. النقاط السابقة لا تتغير.
        </p>
      </div>
      <PointsSettings />
    </div>
  );
}
