# Partner product feed

This first integration accepts a reviewed CSV from one authorised store at a time. A store or affiliate programme must permit Fit&Shop to display its product names, images, prices and links. Do not import a scraped catalogue. A direct agreement or affiliate programme should cover image use, attribution, updates and commission.

## Format

Use [the CSV header template](partner-feed-template.csv). Each row is one available size of an item. Quote a field if it contains a comma. Keep the same merchant and SKU for sizes of the same product; the importer combines them.

| Column | Meaning |
| --- | --- |
| merchant | Store name as shown to shoppers. One store per file. |
| sku | Stable product identifier within that store. |
| audience | `men` or `women`. |
| category | `top`, `bottom`, `shoe`, or `accessory`. |
| name | Product name. |
| price_gbp | GBP price, for example `59.99`. |
| color_family | black, white, grey, navy, tan, brown, blue, orange, red, green, yellow, or purple. |
| size | Exact size shown in Fit&Shop's profile selector. Map each store's sizing deliberately; the same label can fit differently by brand. |
| product_url | Approved HTTPS product or tracked affiliate link. |
| image_url | Approved HTTPS image URL for that item, preferably a model photo when licensed. |
| in_stock | `true` or `false`. |

## Import and review

```bash
npm run import:partner -- /path/to/approved-store.csv --dry-run
npm run import:partner -- /path/to/approved-store.csv
npm run build
```

The import replaces that store's previous products in `src/lib/partner-products.json`, retaining other stores. Review the JSON diff and product links, commit it, then deploy. There are no real partner products in the repository yet. Entries older than seven days are hidden automatically until refreshed. The site uses sample outfits whenever the current partner catalogue cannot assemble a complete look for a shopper's sizes and budget.

This is a manual first step. Larger feeds should move to scheduled ingestion and a database rather than committing every refresh to Git. The site sends shoppers to the retailer for purchase and does not take payments.
