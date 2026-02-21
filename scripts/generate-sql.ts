import { trufadosMapping } from '../server/trufados-mapping';
import fs from 'fs';
import path from 'path';

let sqlCommands = `-- COLE ESTE SCRIPT INTEIRO E EXECUTE NA ABA "QUERY" OU "DATA" DO SEU BANCO MYSQL NA RAILWAY\n\n`;

for (const item of trufadosMapping) {
    if (!item.imageUrl || item.imageUrl.includes('.png')) continue;

    const arrStr = JSON.stringify([item.imageUrl]);

    // String escape single quotes if needed (not needed for our UUIDs)
    sqlCommands += `UPDATE products SET imageUrl = '${item.imageUrl}', galleryImages = '${arrStr}' WHERE slug = '${item.slug}';\n`;

    const flavorTokens = item.slug.replace('ovo-trufado-', '').split('-');
    let flavorLikeStr = '';
    // Simple logic for flavor like
    if (item.slug === 'ovo-trufado-maracuja-nutella') flavorLikeStr = 'Maracujá com Nutella';
    else if (item.slug === 'ovo-trufado-laka-oreo-nutella') flavorLikeStr = 'Laka Oreo com Nutella';
    else if (item.slug === 'ovo-trufado-ninho-nutella') flavorLikeStr = 'Ninho com Nutella';
    else if (item.slug === 'ovo-trufado-doce-de-leite') flavorLikeStr = 'Doce de Leite';
    else if (item.slug === 'ovo-trufado-ferrero-rocher') flavorLikeStr = 'Ferrero Rocher';
    else if (item.slug === 'ovo-trufado-maracuja') flavorLikeStr = 'Maracujá';
    else if (item.slug === 'ovo-trufado-alpino') flavorLikeStr = 'Alpino';
    else if (item.slug === 'ovo-trufado-charge') flavorLikeStr = 'Charge';
    else if (item.slug === 'ovo-trufado-franui') flavorLikeStr = 'Franuí';
    else if (item.slug === 'ovo-trufado-kinder-bueno') flavorLikeStr = 'Kinder Bueno';
    else if (item.slug === 'ovo-trufado-ovomaltine') flavorLikeStr = 'Ovomaltine';
    else if (item.slug === 'ovo-trufado-pistache') flavorLikeStr = 'Pistache';
    else if (item.slug === 'ovo-trufado-prestigio') flavorLikeStr = 'Prestígio';
    else if (item.slug === 'ovo-trufado-sensação') flavorLikeStr = 'Sensação';
    else if (item.slug === 'ovo-trufado-strogonoff') flavorLikeStr = 'Strogonoff';

    if (flavorLikeStr) {
        sqlCommands += `UPDATE flavors SET imageUrl = '${item.imageUrl}' WHERE name = '${flavorLikeStr}';\n`;
    }
}

sqlCommands += `\n-- FIM DA SINCRONIZAÇÃO\n`;

const outPath = path.join(process.cwd(), 'sql-emergencia-railway.sql');
fs.writeFileSync(outPath, sqlCommands, 'utf-8');
console.log("Arquivo sql-emergencia-railway.sql gerado com sucesso.");
process.exit(0);
