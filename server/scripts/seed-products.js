/**
 * Puts the designed catalogue into MongoDB.
 *
 * The products come straight from the storefront's own `data/catalog.ts` —
 * Node strips the types on import — so a seeded row and the piece the shop
 * renders are the same record, and a product added from the admin panel lands
 * next to them looking exactly the same.
 *
 * Safe to re-run: rows are matched on slug and updated in place.
 *
 *   npm run seed
 */

require("dotenv").config({ quiet: true });

const path = require("path");
const { pathToFileURL } = require("url");
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const CATALOG = path.join(__dirname, "..", "..", "client", "data", "catalog.ts");

/* The storefront mock carries no stock or status, so both are derived from the
   product id — deterministic, so re-seeding does not reshuffle the table, and
   spread out enough that the low-stock and out-of-stock states are visible. */
const seeded = (id, span) => {
    let hash = 0;
    for (let index = 0; index < id.length; index++) {
        hash = (hash * 31 + id.charCodeAt(index)) % 9973;
    }
    return hash % span;
};

const toDocument = (product) => ({
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: product.price,
    previousPrice: product.previousPrice,
    image: product.image,
    images: product.images ?? [],
    description: product.description,
    details: product.details ?? [],
    colors: product.colors ?? [],
    sizes: product.sizes ?? [],
    badge: product.badge,
    collections: product.collections ?? [],
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    stock: seeded(product.id, 48),
    isActive: seeded(product.id, 11) !== 0
});

const run = async () => {
    const { products } = await import(pathToFileURL(CATALOG).href);

    await mongoose.connect(process.env.MONGO_URI);

    const result = await Product.bulkWrite(
        products.map((product) => ({
            updateOne: {
                filter: { slug: product.slug },
                update: { $set: toDocument(product) },
                upsert: true
            }
        }))
    );

    console.log(`Seeded ${products.length} products — ${result.upsertedCount} added, ${result.modifiedCount} updated.`);
    console.log(`Catalogue now holds ${await Product.countDocuments()} products.`);

    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exit(1);
});
