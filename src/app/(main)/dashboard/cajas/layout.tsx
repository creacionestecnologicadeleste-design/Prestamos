import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import type { ReactNode } from "react";

export default async function CajasLayout({ children }: { children: ReactNode }) {
    // SECURITY: Ensure user has the required permission for ANY route under /dashboard/cajas
    const hasPermission = await checkPermission("cajas.view");

    if (!hasPermission) {
        redirect("/dashboard/forbidden");
    }

    return <>{children}</>;
}
