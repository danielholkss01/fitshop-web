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

## Feed products without sizes

Some advertiser feeds contain real photos, prices and Awin links but omit size-level availability. They cannot be used in the size-matched outfit builder. Use the separate discovery importer to place confirmed-for-sale products on `/shop`, where shoppers select their size at the retailer:

```bash
npm run import:awin:discovery -- /path/to/advertiser.csv.gz --advertiser-id 130505 --publisher-id 3111579 --audience men --feed-id 118153 --dry-run
npm run import:awin:discovery -- /path/to/advertiser.csv.gz --advertiser-id 130505 --publisher-id 3111579 --audience men --feed-id 118153
```

Set `--audience` only after confirming the advertiser's range. The importer requires an in-stock item marked for sale, GBP price, fashion category, HTTPS image, and a tracked Awin link with the expected publisher and advertiser IDs. It replaces that feed's products while retaining other imported sources. It does not infer a garment's available sizes, generate an outfit, or show it on a person's photo. Review the store's programme terms and the imported JSON before publishing. Never commit the raw feed or its download URL.

The first Baccus (UK) feed contained 229 rows. It marked 125 as not for sale, and supplied no usable sizes for any row. The discovery page therefore displays 104 items, subject to fresh feed data. Its store assortment is men's fashion; other approved retailers can be imported separately for women's fashion and different price ranges.

## Daily Baccus refresh

The `Refresh Baccus product feed` GitHub Action runs each day at 07:17 UTC and can also be started manually from the repository's Actions tab. It downloads the approved Baccus legacy CSV gzip feed, checks the file and importer output, runs the Awin tests and production build, and commits the updated discovery catalog to `main`. A normal Vercel deployment of that commit updates the shop. If the feed fails validation, it leaves the published catalog untouched; the shop hides listings after seven days without a successful refresh.

To enable the action, copy the **full reusable download URL** from Awin's Toolbox → Create-a-Feed for the Baccus feed. Use CSV with gzip compression and all available columns. In GitHub, open this repository's Settings → Secrets and variables → Actions → New repository secret, name it `AWIN_BACCUS_FEED_URL`, and paste the URL as its value. The link contains credentials: never place it in the repository, a public issue, or chat. The workflow skips downloads until the secret exists. After adding it, run the workflow once from Actions and confirm both that it succeeds and that Vercel has deployed the new `main` commit. If the GitHub Actions bot cannot push to a protected `main` branch or its commit does not deploy, address the repository or Vercel permissions before relying on the schedule.

## Current capacity

The present site stores size-verified partner products in `src/lib/partner-products.json` and browsable products in `src/lib/discovery-products.json`. Outfits are paged and the first page deliberately includes options across the available price range within the shopper's budget. Search retains only results needed for the requested page, but still scans eligible combinations on each request. A modest initial feed can be checked this way; a full multi-brand catalog requires scheduled ingestion, indexed storage and database-backed matching. The Baccus refresh starts only after its repository secret is added. Imported listings expire from the site after seven days unless refreshed and deployed. Baccus discovery products do not enter the size-based outfit matcher.
