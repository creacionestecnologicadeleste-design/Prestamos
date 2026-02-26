import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Tecnologica Del Este",
  version: packageJson.version,
  copyright: `© ${currentYear}, Desarrollado por: Tecnologica Del Este.`,
  meta: {
    title: "Tecnologica Del Este - Modern Next.js Dashboard Starter Template",
    description:
      "Tecnologica Del Este is a modern dashboard for managing loans and financial operations.",
  },
};
