# Generated sample look images

The sample catalogue has fictional products and illustrative GBP prices. `public/demo/looks/` contains one generated full-body styling photograph for every sample top, bottom and shoe combination currently emitted by the recommender. The filename is the three product IDs joined by hyphens, for example `t2-b2-s1.webp`. `src/lib/demo-look-images.ts` is the reviewed allowlist; a newly introduced combination must have a matching image before it is shown as a pictured sample look.

The top, bottom and shoe thumbnails in each card are CSS crops of the **same full-body image**. No separately sourced garment or model photo is claimed to be that product. The images depict fictional clothing concepts, not retailer stock, licensed merchandise, an exact fit prediction, or a try-on using a shopper's photo. The sample catalogue intentionally has no accessories because those pieces are absent from the model photos.

When real partner products arrive, the feed's image and link for each specific product are displayed in the item rows. A full-body model wearing that exact collection requires verified retailer imagery or a separate authorized try-on pipeline; the sample generated image must not be reused as proof of a partner product's appearance.
