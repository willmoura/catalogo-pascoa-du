SET NAMES utf8mb4;
USE pascoa_du_shop;

-- Products
UPDATE products SET name = 'Ovo Trufado Limão', description = 'Trufa cremosa de limão siciliano', shortDescription = 'Trufa cremosa de limão siciliano' WHERE slug = 'ovo-trufado-limao';
UPDATE products SET name = 'Ovo Trufado Maracujá', description = 'Trufa cremosa de maracujá', shortDescription = 'Trufa cremosa de maracujá' WHERE slug = 'ovo-trufado-maracuja';
UPDATE products SET name = 'Ovo ao Leite Clássico', description = 'Chocolate ao leite tradicional', shortDescription = 'Chocolate ao leite tradicional' WHERE slug = 'ovo-ao-leite-classico';
UPDATE products SET name = 'Ovo Duo Clássico', description = 'Meio ao leite, meio branco', shortDescription = 'Meio ao leite, meio branco' WHERE slug = 'ovo-duo-classico';
UPDATE products SET name = 'Talentino Avelã', description = 'Com avelã', shortDescription = 'Com avelã' WHERE slug = 'talentino-avela';
UPDATE products SET name = 'Ovo Amargo 70% Cacau', description = '70% cacau, intenso', shortDescription = '70% cacau, intenso' WHERE slug = 'ovo-amargo-70';
UPDATE products SET name = 'Ovo de Chocolate Branco', description = 'Ovo de chocolate branco com textura cremosa e sabor suave', shortDescription = 'Cremoso e delicado' WHERE slug = 'chocolate-branco';

-- Flavors
UPDATE flavors SET name = 'Prestígio', description = 'Recheio Prestígio' WHERE id = 11;
UPDATE flavors SET name = 'Limão', description = 'Trufa cremosa de limão siciliano' WHERE id = 2; -- Might not exist
UPDATE flavors SET name = 'Avelã', description = 'Pedaços de avelã' WHERE id = 15; -- Might not exist

-- Categories
UPDATE categories SET name = 'Linha Trufada Gourmet', description = 'Ovos trufados premium' WHERE slug = 'linha-trufada-gourmet';
