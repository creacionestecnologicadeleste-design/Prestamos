import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import { headers } from "next/headers";
import type { ReactNode } from "react";

export default async function ReportsLayout({ children }: { children: ReactNode }) {
    const headersList = await headers();
    const pathname = headersList.get("x-invoke-path") || "";

    // We can't easily get the pathname in a server layout without middleware or explicit page checks
    // But we CAN check the permissions needed for the sub-routes.
    // However, since this is a layout, it will run for ALL reports.

    // To be precise, it's better to let the pages handle it OR use a middleware approach.
    // Given the constraints, I will create small server wrapper pages or check in the layout by inferred path.

    return <>{children}</>;
}
