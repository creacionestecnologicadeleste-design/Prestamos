const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'app', '(main)', 'dashboard', 'cajas', '[id]', 'page.tsx');
const destDir = path.join(__dirname, '..', 'src', 'app', '(main)', 'dashboard', 'bancos', '[id]');
fs.mkdirSync(destDir, { recursive: true });
const dest = path.join(destDir, 'page.tsx');

let content = fs.readFileSync(src, 'utf8');

// Component name
content = content.replace(/CajaDetailPage/g, 'BancoDetailPage');

// Keep API endpoint the same (bancos are stored in cajas table)
// Replace "Caja " with "Cuenta Bancaria " in the UI text
content = content.replace(/Detalles de la Caja/g, 'Detalles de la Cuenta Bancaria');
content = content.replace(/Caja no encontrada/g, 'Cuenta no encontrada');
content = content.replace(/Esta caja/g, 'Esta cuenta');
content = content.replace(/caja Principal/g, 'cuenta principal');

// Replace "Caja" in breadcrumb/links
content = content.replace(/"\/dashboard\/cajas"/g, '"/dashboard/bancos"');
content = content.replace(/> Cajas </g, '> Bancos <');

fs.writeFileSync(dest, content);
console.log('BancoDetailPage scaffolded successfully.');
