import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import CajasContent from "./cajas-content";

export default async function CajasPage() {
    // SECURITY: Ensure user has the required permission
    const hasPermission = await checkPermission("cajas.view");

    if (!hasPermission) {
        redirect("/dashboard/forbidden");
    }

    return <CajasContent />;
}
