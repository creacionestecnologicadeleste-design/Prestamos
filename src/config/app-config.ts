import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Inversiones J&T",
  version: packageJson.version,
  copyright: `© ${currentYear}, Desarrollado por: Inversiones J&T.`,
  meta: {
    title: "Inversiones J&T - Gestión de Préstamos y Operaciones Financieras",
    description:
      "Inversiones J&T es una plataforma moderna para la gestión de préstamos y operaciones financieras.",
  },
};
