# Customer design studio

Fit&Shop shoppers can draft an artwork file on `/design`. With Printify catalog access, they can also choose a real blank product, print provider, available variant and print area. The catalog photo is displayed as a plain product photo, separate from the artwork preview. No generated photo claims to show the finished product.

## Connect the catalog

In Printify, create a personal access token at My Profile → Connections. Give it `catalog.read` and `print_providers.read` access for this read-only catalog stage. Add it to the Fit&Shop Vercel project as the server-side environment variable `PRINTIFY_API_TOKEN`, for the environments you want to test, then redeploy. For local development, place it in an ignored `.env.local` file. Never put the token in Git, a browser variable or a chat message. Printify tokens expire after one year.

The site's server requests Printify blueprints, providers and in-stock variants. All Printify catalog items can be reached through search and pagination. The first All items page mixes women's, men's, unisex and other adult clothing before accessories and non-clothing items. Audience and type filters use catalog titles, so products with ambiguous titles remain under Everyone and All items. Searches for `gown` also find products named `dress`, but the site does not invent products missing from Printify. An empty Printify My Products page does not block catalog browsing because blueprints are different from products created in a shop.

## What the draft does

- Artwork can contain a shopper's PNG/JPEG and a short text line. The browser composites them into a transparent PNG at the chosen print area's dimensions (or a generic draft size before a product is chosen).
- The selected product's actual catalog photo, brand, provider, variant and print area come from Printify after connection. This photo does not depict the custom design or show it on the shopper.
- Artwork stays in the browser until the shopper downloads it. There is no account, server upload or saved draft in this stage.
- There is no retail price, final production mockup, checkout, address collection or Printify order submission. It cannot sell or fulfil a customised item yet.

## Next integration stage

For a purchase flow, Fit&Shop needs an API-connected Printify shop, secure artwork upload, verified print-area positioning and mockup review, delivery prices for the shopper's address, GBP retail pricing, payment capture, and a server-side order handoff after payment. Printify's order API can create a product from a catalog blueprint and customer artwork during order creation, so the merchant does not have to pre-design every item. Order creation must be idempotent and tied to a paid checkout. A body photo for try-on is separate from print artwork and should never be sent to Printify as a design unless the shopper explicitly chooses that.

The first real account and catalog response still need to be checked against the adapter before checkout work. Printify may change fields or availability by provider and destination.
