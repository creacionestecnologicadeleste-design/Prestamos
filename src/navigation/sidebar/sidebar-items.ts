import {
  Banknote,
  Calendar,
  ChartBar,
  Fingerprint,
  PlusCircle,
  Gauge,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
  ShieldCheck,
  Key,
  Users,
  Vault,
  Ban,
  CheckCircle2,
  UserPlus,
  XCircle,
  DollarSign,
  Building2,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  requiredPermission?: string;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  requiredPermission?: string;
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
        requiredPermission: "dashboard.view",
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
        requiredPermission: "reports.portfolio",
      },
      {
        title: "Morosidad",
        url: "/dashboard/reports/overdue",
        icon: Gauge,
        requiredPermission: "reports.overdue",
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
        requiredPermission: "cajas.view",
        subItems: [
          {
            title: "Flujo de Caja",
            url: "/dashboard/reports/cash-flow",
            icon: Calendar,
            requiredPermission: "reports.cashflow",
          },
          {
            title: "Gestión de Cajas",
            url: "/dashboard/cajas",
            icon: Vault,
            requiredPermission: "cajas.view",
          },
        ],
      },
      {
        title: "Bancos",
        url: "/dashboard/bancos",
        icon: Building2,
        requiredPermission: "cajas.view",
        subItems: [], // Will be populated dynamically
      },
      {
        title: "Clientes",
        url: "/dashboard/clients",
        icon: Users,
        requiredPermission: "clients.view",
        subItems: [
          {
            title: "Crear Cliente",
            url: "/dashboard/clients/crear",
            icon: Users,
            requiredPermission: "clients.create",
          },
          {
            title: "Listado de Clientes",
            url: "/dashboard/clients/listado",
            icon: Users,
            requiredPermission: "clients.view",
          },
        ],
      },
      {
        title: "Pagos",
        url: "/dashboard/payments",
        icon: ReceiptText,
        requiredPermission: "payments.history",
        subItems: [
          {
            title: "Registro de Pagos",
            url: "/dashboard/payments/registrar",
            icon: ReceiptText,
            requiredPermission: "payments.register",
          },
          {
            title: "Historial de Pagos",
            url: "/dashboard/payments/historial",
            icon: ReceiptText,
            requiredPermission: "payments.history",
          }
        ]
      },
      {
        title: "Cobranzas",
        url: "/dashboard/collections",
        icon: ReceiptText,
        requiredPermission: "collections.view",
        subItems: [
          {
            title: "Cuotas Vencidas",
            url: "/dashboard/collections/overdue",
            icon: ReceiptText,
            requiredPermission: "collections.view",
          },
          {
            title: "Intereses por Mora",
            url: "/dashboard/collections/penalties",
            icon: ReceiptText,
            requiredPermission: "collections.manage",
          }
        ]
      },
      {
        title: "Préstamos",
        url: "/dashboard/loans",
        icon: Banknote,
        requiredPermission: "loans.view",
        subItems: [
          {
            title: "Nueva Solicitud",
            url: "/dashboard/loans/solicitud",
            icon: PlusCircle,
            requiredPermission: "loans.create",
          },
          {
            title: "Préstamos Activos",
            url: "/dashboard/loans/listado",
            icon: ReceiptText,
            requiredPermission: "loans.view",
          },
          {
            title: "Préstamos Aprobados",
            url: "/dashboard/loans/aprobados",
            icon: CheckCircle2,
            requiredPermission: "loans.approve",
          },
          {
            title: "Préstamos Pagados",
            url: "/dashboard/loans/pagados",
            icon: Banknote,
            requiredPermission: "loans.view",
          },
          {
            title: "Préstamos Rechazados",
            url: "/dashboard/loans/rechazados",
            icon: Ban,
            requiredPermission: "loans.view",
          },
          {
            title: "Préstamos Anulados",
            url: "/dashboard/loans/anulados",
            icon: XCircle,
            requiredPermission: "loans.annul",
          },
          {
            title: "Tipos de Préstamo",
            url: "/dashboard/loans/tipos",
            icon: Fingerprint,
            requiredPermission: "loans.types.manage",
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
        requiredPermission: "users.view",
        subItems: [
          {
            title: "Crear Usuario",
            url: "/dashboard/settings/users/crear",
            icon: UserPlus,
            requiredPermission: "users.manage",
          },
          {
            title: "Roles",
            url: "/dashboard/settings/users/roles",
            icon: ShieldCheck,
            requiredPermission: "roles.manage",
          },
          {
            title: "Permisos",
            url: "/dashboard/settings/users/permissions",
            icon: Key,
            requiredPermission: "roles.manage",
          },
          {
            title: "Config. Financiera",
            url: "/dashboard/settings/financial",
            icon: DollarSign,
            requiredPermission: "accounts.categories.manage",
          },
        ],
      },
    ],
  },
];
