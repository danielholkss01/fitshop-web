# Awin product feeds

Fit&Shop can import an advertiser's Awin fashion feed once the publisher account has access to it. Awin supplies the advertiser's product data, images and tracked links; Fit&Shop uses the product's actual size, colour, stock status and GBP price to build outfits. This import does not create products or take payment.

## Obtain a feed

In Awin, open Toolbox → Create-a-Feed, choose an advertiser feed you are allowed to use, and include all columns. Awin offers legacy CSV downloads and enhanced retail feeds. For a legacy feed, download the CSV (plain or gzip). For an enhanced feed, download the JSONL using Awin's publisher feed API. Do not put the data-feed API key, API token or secret download URL in Git or a chat message. Awin's Product Feed List shows available feeds and their last update times.

Only use feeds available to the approved publisher account, in line with the advertiser programme terms. The importer requires an Awin tracked link or constructs one from an enhanced feed's advertiser and publisher IDs. Check a product link before using it publicly.

## Inspect and import

```bash
npm ci
npm run import:awin -- /path/to/advertiser.csv.gz --format legacy --advertiser-id 1234 --size-system UK --dry-run
npm run import:awin -- /path/to/advertiser.csv.gz --format legacy --advertiser-id 1234 --size-system UK
```

For enhanced JSONL:

```bash
npm run import:awin -- /path/to/advertiser.jsonl --format enhanced --advertiser-id 1234 --publisher-id 5678 --merchant 'Advertiser name' --dry-run
npm run import:awin -- /path/to/advertiser.jsonl --format enhanced --advertiser-id 1234 --publisher-id 5678 --merchant 'Advertiser name'
```

`--feed-id` distinguishes multiple feeds from one advertiser. `--size-system` is for a verified feed whose numeric sizes use UK, EU or another named system. Numeric shoe sizes with no known system are skipped. Products without confirmed stock, an exact size, GBP price, image, colour, adult audience or tracked shopping link are skipped. The summary reports why rows were skipped. Products from other imported feeds stay in place. Review the JSON diff and a few item images, prices, sizes and links before deploying.

The importer uses broad garment rules and provisional style tags; real fashion feeds need tagging review before being recommended. It does not claim that a store's size label guarantees a fit. The generated sample model photos do not represent imported products. Awin's newer format may vary by advertiser, so the first real feed should be checked against these assumptions.

## Current capacity

The present site stores partner products in `src/lib/partner-products.json` and builds combinations in server memory. A modest initial feed can be checked this way, but a full multi-brand catalog requires scheduled ingestion, indexed storage and paginated matching. There is no automatic Awin refresh yet. Imported listings expire from the site after seven days unless refreshed and deployed. No real products have been imported into the repository.
