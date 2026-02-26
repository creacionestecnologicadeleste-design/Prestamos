"use client";

import * as React from "react";
import { BadgeCheck, Bell, CreditCard, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export function AccountSwitcher() {
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user;

  const trigger = user ? (
    <Avatar className="size-9 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
      <AvatarImage src={user.image || undefined} alt={user.name || ""} />
      <AvatarFallback className="rounded-lg">{getInitials(user.name || "U")}</AvatarFallback>
    </Avatar>
  ) : (
    <div className="size-9 rounded-lg bg-muted animate-pulse" />
  );

  if (!mounted || !user) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
            <AvatarFallback className="rounded-lg">{getInitials(user.name || "U")}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck className="size-4" />
            Cuenta
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="size-4" />
            Nomina
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="size-4" />
            Notificaciones
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/auth/v2/login" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
