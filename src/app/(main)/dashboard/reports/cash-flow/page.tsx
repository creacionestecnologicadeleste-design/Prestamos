import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import CashFlowContent from "./cash-flow-content";

export default async function CashFlowPage() {
    // SECURITY: This report is related to both Reports and Cajas module perception
    const hasPermission = await checkPermission("reports.cashflow");

    if (!hasPermission) {
        redirect("/dashboard/forbidden");
    }

    return <CashFlowContent />;
}
