import {
  Banknote,
  Calendar,
  ChartBar,
  Fingerprint,
  Forklift,
  Gauge,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  ReceiptText,
  ShoppingBag,
  SquareArrowUpRight,
  Users,
  Vault,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Panel Principal",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/crm",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Operaciones",
    items: [
      {
        title: "Clientes",
        url: "/dashboard/clients",
        icon: Users,
      },
      {
        title: "Préstamos",
        url: "/dashboard/loans",
        icon: Banknote,
      },
      {
        title: "Pagos",
        url: "/dashboard/payments",
        icon: ReceiptText,
      },
      {
        title: "Cajas",
        url: "/dashboard/cajas",
        icon: Vault,
        isNew: true,
      },
    ],
  },
  {
    id: 3,
    label: "Analítica y Reportes",
    items: [
      {
        title: "Cartera Activa",
        url: "/dashboard/reports/portfolio",
        icon: ChartBar,
      },
      {
        title: "Morosidad",
        url: "/dashboard/reports/overdue",
        icon: Gauge,
      },
      {
        title: "Flujo de Caja",
        url: "/dashboard/reports/cash-flow",
        icon: Calendar,
      },
    ],
  },
  {
    id: 4,
    label: "Configuración",
    items: [
      {
        title: "Usuarios",
        url: "/dashboard/settings/users",
        icon: Lock,
      },
    ],
  },
];
