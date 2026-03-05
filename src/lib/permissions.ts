import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "./db";
import { rolePermissions, permissions as permissionsTable } from "./db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Checks if the currently authenticated user has a specific permission.
 * This function should be called in Server Components or Server Actions.
 * 
 * @param permissionName The technical name of the permission (e.g., 'loans.view')
 * @returns Promise<boolean>
 */
export async function checkPermission(permissionName: string): Promise<boolean> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.role) {
            return false;
        }

        const roleId = session.user.role as string;

        console.log(`[DEBUG_PERM] User Role ID: ${roleId} | Checking Permission: ${permissionName}`);

        // Query the database to see if the role has the requested permission
        const permission = await db
            .select({
                id: rolePermissions.id
            })
            .from(rolePermissions)
            .innerJoin(
                permissionsTable,
                eq(rolePermissions.permissionId, permissionsTable.id)
            )
            .where(
                and(
                    eq(rolePermissions.roleId, roleId),
                    eq(permissionsTable.name, permissionName)
                )
            )
            .limit(1);

        const hasPermission = permission.length > 0;
        console.log(`[DEBUG_PERM] Result for ${permissionName}: ${hasPermission}`);
        return hasPermission;
    } catch (error) {
        console.error(`[CHECK_PERMISSION_ERROR] Name: ${permissionName}`, error);
        return false;
    }
}

/**
 * Utility to check multiple permissions (logical AND).
 */
export async function checkAllPermissions(permissionNames: string[]): Promise<boolean> {
    const results = await Promise.all(
        permissionNames.map(name => checkPermission(name))
    );
    return results.every(res => res === true);
}

/**
 * Utility to check any of the permissions (logical OR).
 */
export async function checkAnyPermission(permissionNames: string[]): Promise<boolean> {
    const results = await Promise.all(
        permissionNames.map(name => checkPermission(name))
    );
    return results.some(res => res === true);
}
