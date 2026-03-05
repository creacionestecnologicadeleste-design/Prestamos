import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import PortfolioReportContent from "./portfolio-content";

export default async function PortfolioReportPage() {
    if (!(await checkPermission("reports.portfolio"))) {
        redirect("/dashboard/forbidden");
    }

    return <PortfolioReportContent />;
}
