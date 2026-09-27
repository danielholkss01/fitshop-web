# Partner product feed

This first integration accepts a reviewed CSV from one authorised store at a time. A store or affiliate programme must permit Fit&Shop to display its product names, images, prices and links. Do not import a scraped catalogue. A direct agreement or affiliate programme should cover image use, attribution, updates and commission.

## Format

Use [the CSV header template](partner-feed-template.csv). Each row is one available size of an item. Quote a field if it contains a comma. Keep the same merchant and SKU for sizes of the same product variant; the importer combines them. Import the full authorised feed without selecting individual products. The importer replaces only that merchant's previous products, so multiple suppliers can coexist.

| Column | Meaning |
| --- | --- |
| merchant | Store name as shown to shoppers. One store per file. |
| sku | Stable product identifier within that store. |
| audience | `men`, `women`, or `unisex`. The size still has to match the shopper's entered size. |
| category | `top`, `bottom`, `one-piece`, `outerwear`, `shoe`, or `accessory`. `one-piece` covers dresses, gowns and jumpsuits; `outerwear` covers jackets, blazers and coats. |
| name | Product name. |
| garment_type | Optional specific type, such as polo, jeans, skater dress or blazer. Not restricted to a fixed list. |
| brand | Optional brand as supplied by the authorised merchant. |
| material | Optional merchant supplied material description. |
| price_gbp | GBP price, for example `59.99`. |
| color_family | black, white, grey, navy, tan, brown, blue, orange, red, green, yellow, or purple. |
| size | Available size. Shoppers can enter any size; map each store's sizing deliberately because the same label can fit differently by brand. `one-piece` and `outerwear` match the shopper's top/dress size. |
| style_tags | One or more reviewed labels separated by `|`: `relaxed`, `polished`, `street`. |
| style_details | Optional specific descriptors separated by `|`, such as minimalist, bohemian, formal, maxi or athletic. These are displayed, but the three broad `style_tags` drive matching for now. |
| occasion_tags | One or more reviewed labels separated by `|`: `everyday`, `work`, `going-out`. |
| product_url | Approved HTTPS product or tracked affiliate link. |
| image_url | Approved HTTPS image URL for that item, preferably a model photo when licensed. |
| in_stock | `true` or `false`. |

## Import and review

```bash
npm run import:partner -- /path/to/approved-store.csv --dry-run
npm run import:partner -- /path/to/approved-store.csv
npm run build
```

The import replaces that store's previous products in `src/lib/partner-products.json`, retaining other stores. Review the JSON diff, tags and product links, commit it, then deploy. Tag each item based on its actual cut and use; avoid assuming a style from the shopper's gender or the item colour. There are no real partner products in the repository yet. Entries older than seven days are hidden automatically until refreshed. The site uses sample outfits whenever the current partner catalogue cannot assemble a complete look for a shopper's sizes, taste and budget.

This is a manual first step. Larger feeds need scheduled ingestion and a database with indexed candidate retrieval and page cursors rather than committing every refresh to Git. The current generator ranks every combination in memory, which suits a small approved feed but is not yet suitable for an unrestricted multi-brand catalogue. Until actual supplier feeds are connected, no new purchasable products appear. The site sends shoppers to the retailer for purchase and does not take payments.
