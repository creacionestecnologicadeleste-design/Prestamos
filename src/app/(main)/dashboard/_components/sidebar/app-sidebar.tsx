"use client";

import * as React from "react";
import Link from "next/link";

import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings, Building2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

export function AppSidebar({ userPermissions, ...props }: React.ComponentProps<typeof Sidebar> & { userPermissions?: string[] }) {
  const [mounted, setMounted] = React.useState(false);
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const { data: bankAccounts } = useQuery({
    queryKey: ["sidebar-banks"],
    queryFn: async () => {
      const { data } = await axios.get("/api/bancos");
      return data;
    },
  });

  const enrichedSidebarItems = React.useMemo(() => {
    return sidebarItems.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.title === "Bancos") {
          return {
            ...item,
            subItems: [
              {
                title: "Resumen de Bancos",
                url: "/dashboard/bancos",
                icon: Building2,
              },
              ...(bankAccounts || []).map((bank: any) => ({
                title: bank.nombre,
                url: `/dashboard/bancos/${bank.id}`,
                icon: Building2,
              })),
            ],
          };
        }
        return item;
      }),
    }));
  }, [bankAccounts]);

  if (!mounted) {
    return <Sidebar {...props} variant={variant} collapsible={collapsible} />;
  }

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/dashboard/default">
                <Command />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={enrichedSidebarItems} userPermissions={userPermissions} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
