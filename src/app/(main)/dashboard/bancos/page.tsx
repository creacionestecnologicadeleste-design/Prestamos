import type { Metadata } from "next";
import BancosContent from "./bancos-content";

export const metadata: Metadata = {
    title: "Bancos",
    description: "Gestión de cuentas bancarias de la empresa",
};

export default function BancosPage() {
    return <BancosContent />;
}
