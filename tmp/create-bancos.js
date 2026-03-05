const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'src', 'app', '(main)', 'dashboard', 'cajas', 'cajas-content.tsx');
const destFile = path.join(__dirname, '..', 'src', 'app', '(main)', 'dashboard', 'bancos', 'bancos-content.tsx');

let content = fs.readFileSync(srcFile, 'utf8');

// Replacements
content = content.replace(/CajasContent/g, 'BancosContent');
content = content.replace(/cajas/g, 'bancos');
content = content.replace(/Cajas/g, 'Bancos');
content = content.replace(/CajaCard/g, 'BancoCard');
content = content.replace(/\/api\/bancos\/stats/g, '/api/cajas/stats'); // Keep using the same stats API for now
content = content.replace(/caja=/g, 'banco=');
content = content.replace(/caja: Caja/g, 'banco: Caja');
content = content.replace(/bancos-stats/g, 'cajas-stats'); // Revert queryKey

// We already filter banks in /api/bancos so we don't need to filter categories in the UI.
// But we need to revert the filter we just added to cajas-content.tsx
content = content.replace(/categories\?\.filter\(c => c\.icon !== "bank"\)/g, 'categories?.filter(c => c.icon === "bank")');
content = content.replace(/c\.\w+Id && c\.category\?\.icon !== "bank"/g, 'c.categoryId && c.category?.icon === "bank"');

fs.writeFileSync(destFile, content);
console.log('BancosContent scaffolded successfully.');
