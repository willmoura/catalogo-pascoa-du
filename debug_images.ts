
import { db } from './server/db';
import { products } from './drizzle/schema';

async function checkImages() {
    try {
        const allProducts = await db.select().from(products).limit(5);
        console.log('Product Images:');
        allProducts.forEach(p => {
            console.log(`ID: ${p.id}, Name: ${p.name}, ImageUrl: ${p.imageUrl}`);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

checkImages();
