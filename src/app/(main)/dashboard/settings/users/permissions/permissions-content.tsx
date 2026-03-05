import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import PermissionsContent from "./permissions-content";

export default async function PermissionsPage() {
    if (!(await checkPermission("users.view"))) {
        redirect("/dashboard/forbidden");
    }

    return <PermissionsContent />;
}
