# Q2: Walrus Sites SPA fallback — RESOLVED ✅

**Question**: Bisa Walrus Sites pakai dynamic routes (`/f/[formId]`, `/a/[formId]`) → fall back ke `index.html`?

**Answer**: **Ya**, native via `ws-resources.json` config file.

## Cara konfigurasi

Tambahkan file `ws-resources.json` di root build folder yang di-deploy via `site-builder`:

```json
{
  "site_name": "catat",
  "metadata": {
    "title": "catat — Walrus-native feedback platform",
    "description": "Build forms, collect feedback, store on Walrus. Encrypted via Seal."
  },
  "headers": {
    "/index.html": {
      "Cache-Control": "no-cache"
    }
  },
  "routes": {
    "/f/*": "/index.html",
    "/a/*": "/index.html",
    "/b/*": "/index.html",
    "/embed/*": "/index.html",
    "/p/*": "/index.html"
  }
}
```

## Constraint

- **Wildcard `*` hanya di akhir path**. Jadi `/f/*` valid, tapi `/f/*/edit` atau `*/f/*` **tidak** valid.
- Resource path di kanan (mis. `/index.html`) harus benar-benar ada di build output, kalau tidak deploy contract akan abort.
- Update site = upload ulang via `site-builder deploy`. Object ID tetap sama, content yang diganti.

## Implication untuk catat

Semua route client-side (`/f/:id`, `/a/:id`, `/b/:id`, `/embed/:id`, `/p/:id`) cocok dengan pattern wildcard di atas. React Router (atau TanStack Router) handle routing client-side setelah index.html ke-load. Tidak butuh hash routing (`#/f/...`) — pure path-based routing works.

## Deploy command

```bash
# di packages/web setelah `npm run build`
site-builder --context=testnet deploy ./dist --epochs 26
```

`./dist` harus berisi `index.html`, asset, dan `ws-resources.json` di root.

## Sumber

- [Walrus Sites — Specifying headers, routing, and metadata](https://docs.wal.app/walrus-sites/routing.html)
- [Deploy a Walrus Site (getting started)](https://docs.wal.app/docs/sites/getting-started/publishing-your-first-site)
