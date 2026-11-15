# Tanah Kampong

Finds land in southern Johor for one family compound (a "kampong" of connected houses). It covers plots big enough on their own and small plots that could be bought together with a neighbour. Same look and feel as Tanah (SG/London): tokens, fonts, logo and components are copied from `tanah/web/src`.

Vite + React + Leaflet. Static: no server and no keys. The data ships in the bundle.

```
npm install
npm run dev        # local
npm run build      # → dist/, deployed by Netlify (site tanah-kampong) on push to main
```

## Pages
- **Plots**: map with filters, a sortable table, and plot details (price in S$ and RM, acres/sqft/m², zoning vs title, foreign-buyer status, distance to the crossings, the seller's adjacency wording).
- **Combine plots**: sets of plots that could be combined, strongest evidence first (see below). Set the compound size and the "pins close" distance.
- **Compound concepts**: the illustration gallery.
- **Sources & limits**: what the data does and doesn't show, and how to confirm a combination.

## Data
`data/plots.json` holds one row per plot or lot. It is built by `tools/merge.mjs` from research batches:

```
cp data/legacy.json data/plots.json     # the original 35 hand-collected listings
node tools/merge.mjs research/adjacent.json research/west.json research/central.json research/east.json
```

- **Merge rules:**
  - Rows with the same listing URL merge, unless the sizes differ (then they are separate lots of one listing).
  - A row whose size is the sum of its set is a package listing. It gets `dupOf` and `package`.
  - Same size and same price marks `dupOf` (possibly the same land, re-listed by another agent).
- **Hand corrections** live in `data/overrides.json`, each with its reason. They are re-applied on every merge.
- **Research batches** come from web search snippets (portals block page reads). Fields not stated in the source are null.
- **Schema:** see `FIELDS` in `tools/merge.mjs`. Key fields:
  - `locPrecision`: `exact` / `road` / `area`.
  - `groupHint`: seller-stated set.
  - `adjacent`: the seller's wording.
  - `urlKind`: `listing` / `search`.

## Combination evidence (src/model.js)
1. **Seller says adjoining.** Rows share a `groupHint`, or one listing bundles several lots.
2. **Lot numbers close.** Same mukim, lot numbers within 3.
3. **Same road or kampung.** Same first place name in `locality`.
4. **Pins close.** Both pins at road precision or better, within the chosen distance.

A set is only as strong as its weakest link. Leads (2–4) are shown only when a plot smaller than the target is involved. Nothing proves plots touch except the seller or a certified lot plan.

## Known gaps
- Almost every pin is a town or kampung centre. "Pins close" rarely fires until listings give GPS or lot numbers.
- There are few small (0.5–2 ac) plots on file. A focused search pass is still to do.
- Prices are asking prices with the date seen. Listings may have sold.
