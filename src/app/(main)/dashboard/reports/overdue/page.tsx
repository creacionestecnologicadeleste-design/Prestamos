import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import OverdueContent from "./overdue-content";

export default async function OverdueReportPage() {
    const hasPermission = await checkPermission("reports.overdue");

    if (!hasPermission) {
        redirect("/dashboard/forbidden");
    }

    return <OverdueContent />;
}
