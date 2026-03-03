import {
  Banknote,
  Calendar,
  ChartBar,
  Fingerprint,
  PlusCircle,
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
  ShieldCheck,
  Key,
  Users,
  Vault,
  UserPlus,
  UsersRound,
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
    ],
  },
  {
    id: 2,
    label: "Operaciones",
    items: [
      {
        title: "Cajas",
        url: "/dashboard/cajas",
        icon: Vault,
        isNew: true,
        subItems: [
          {
            title: "Flujo de Caja",
            url: "/dashboard/reports/cash-flow",
            icon: Calendar,
          },
          {
            title: "Gestión de Cajas",
            url: "/dashboard/cajas",
            icon: Vault,
          },
        ],
      },
      {
        title: "Clientes",
        url: "/dashboard/clients",
        icon: Users,
        subItems: [
          {
            title: "Crear Cliente",
            url: "/dashboard/clients/crear",
            icon: Users,
          },
          {
            title: "Listado de Clientes",
            url: "/dashboard/clients/listado",
            icon: Users,
          },
        ],
      },
      {
        title: "Pagos",
        url: "/dashboard/payments",
        icon: ReceiptText,
        subItems: [
          {
            title: "Registro de Pagos",
            url: "/dashboard/payments/registrar",
            icon: ReceiptText,
          },
          {
            title: "Historial de Pagos",
            url: "/dashboard/payments/historial",
            icon: ReceiptText,
          }
        ]
      },
      {
        title: "Cobranzas",
        url: "/dashboard/collections",
        icon: ReceiptText,
        subItems: [
          {
            title: "Cuotas Vencidas",
            url: "/dashboard/collections/overdue",
            icon: ReceiptText,
          },
          {
            title: "Intereses por Mora",
            url: "/dashboard/collections/penalties",
            icon: ReceiptText,
          }
        ]
      },
      {
        title: "Préstamos",
        url: "/dashboard/loans",
        icon: Banknote,
        subItems: [
          {
            title: "Nueva Solicitud",
            url: "/dashboard/loans/solicitud",
            icon: PlusCircle,
          },
          {
            title: "Listado de Préstamos",
            url: "/dashboard/loans/listado",
            icon: ReceiptText,
          },
          {
            title: "Tipos de Préstamo",
            url: "/dashboard/loans/tipos",
            icon: Fingerprint,
          },
        ],
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
        icon: Users,
        subItems: [
          {
            title: "Crear Usuario",
            url: "/dashboard/settings/users/crear",
            icon: UserPlus,
          },
          {
            title: "Roles",
            url: "/dashboard/settings/users/roles",
            icon: ShieldCheck,
          },
          {
            title: "Permisos",
            url: "/dashboard/settings/users/permissions",
            icon: Key,
          },
        ],
      },
    ],
  },
];
