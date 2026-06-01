# Dhan Advisor

A private **wealth terminal for Indian equity investors**, built as a Windows desktop app.

Add the Indian stocks you hold (with the amount you've invested, in **INR**). Dhan Advisor then:

- breaks your money down by **stock and by sector**,
- runs **continuous background research** across a whitelist of reputable Indian financial publishers,
- surfaces **new stocks to consider** — chosen from diversification gaps in your portfolio *and* verified, fresh news momentum,
- gives **rebalancing suggestions** (strong, opinionated — but **only suggestions**).

Everything runs locally. Your portfolio never leaves your machine.

> ⚠️ **Not investment advice.** Dhan Advisor is an educational research tool. It is **not** a SEBI-registered investment adviser. Nothing here is a recommendation to buy or sell. Equities carry risk — consult a qualified, registered financial adviser before acting.

---

## Features at a glance

| Area | What it does |
|------|--------------|
| **Portfolio** | Add holdings by NSE symbol or name (autocomplete), with INR amounts. Inline-edit amounts; auto-computed weights. |
| **Sector allocation** | Donut chart + legend showing how your capital is split across sectors. |
| **Diversification score** | A transparent 0–100 score (based on a normalized Herfindahl index over sector weights + breadth). |
| **Rebalancing suggestions** | Flags single-stock and single-sector over-concentration, thin portfolios, and low sector breadth, with concrete "trim X toward Y%" guidance. |
| **Stocks to consider** | Ranks candidates from a curated NSE universe by *diversification fit* + *verified news momentum*, each with plain-language reasons and clickable source links. |
| **Verified market feed** | A live feed of headlines that passed the verification layer, with a "verified" badge and the count of items that were filtered out. |

---

## The verification layer (how "reliable sources only" works)

Background research **only ever reads from an allowlist** of established Indian financial publishers (Moneycontrol, The Economic Times, Mint, Business Standard, BusinessLine, NDTV Profit). Every fetched item must pass these gates before it can influence a single suggestion:

1. **Domain allowlist** — the article's host must match (or be a subdomain of) a whitelisted publisher.
2. **HTTPS only** — non-secure links are rejected.
3. **Freshness window** — only headlines newer than a configurable window (default 72h) count.
4. **De-duplication** — syndicated copies of the same story are collapsed by normalized title.
5. **Trust weighting** — each source carries an editorial trust weight in `[0, 1]`; a stock's "momentum" is the trust-weighted sum across the *distinct* sources covering it.

The UI always shows how many items were **kept vs. filtered**, and every suggestion links back to the exact verified articles behind it, so you can judge the evidence yourself.

You can add or remove sources in [`src/main/services/sources.ts`](src/main/services/sources.ts).

---

## Install from Git

### Prerequisites
- **[Node.js](https://nodejs.org/) 18 or newer** (ships with `npm`). On Windows, install the LTS build.
- **Git**.

### Run it (development)
```bash
git clone https://github.com/anirudhshandilya01-debug/dhan-advisor.git
cd dhan-advisor
npm install
npm run dev
```
The desktop app launches with hot-reload. Background research starts automatically.

### Build a Windows installer (.exe)
```bash
npm run package:win
```
The signed-on-install NSIS installer appears in `release/` as `Dhan Advisor-Setup-<version>.exe`. Double-click to install; it creates Start-menu and desktop shortcuts. (Run this on Windows for a native Windows build.)

### Other useful scripts
```bash
npm run typecheck     # type-check main + renderer
npm run build         # bundle without packaging
npm run start         # preview the production bundle
npm run package:dir   # unpacked build (no installer) for quick testing
```

---

## How a suggestion is scored

For each candidate stock not already held:

```
score =  diversification_fit   (up to ~45)   # how under-weight its sector is for you
       + verified_news_momentum (up to ~45)  # trust-weighted mentions from the allowlist
       + small large-cap stability bias (5)
```

Only candidates with at least one real reason are shown, ranked high to low, capped at your "max suggestions" setting. The `fit NN` badge is purely for ordering — it is **not** a price target or a rating.

Rebalancing thresholds (single-stock %, single-sector %, refresh cadence, freshness window, number of ideas) are all editable in **Settings**.

---

## Architecture

```
dhan-advisor/
├── electron.vite.config.ts        # build config (main / preload / renderer)
├── electron-builder.yml           # Windows installer packaging
├── build/icon.png                 # app icon
├── src/
│   ├── shared/types.ts            # types shared across all processes
│   ├── main/                      # Electron main process (Node)
│   │   ├── index.ts               # window, IPC handlers, engine wiring
│   │   └── services/
│   │       ├── store.ts           # JSON persistence (per-user app dir)
│   │       ├── stockUniverse.ts   # curated NSE universe + sectors + aliases
│   │       ├── sources.ts         # trusted-source allowlist + verification
│   │       ├── newsFetcher.ts     # background fetch + verify + score
│   │       └── analyzer.ts        # allocation, rebalancing, suggestions
│   ├── preload/                   # secure contextBridge API
│   └── renderer/                  # React + TypeScript UI
│       └── src/components/        # portfolio, chart, suggestions, news, settings
└── scripts/test-logic.ts          # headless logic tests
```

- **Stack:** Electron + Vite + React + TypeScript (via `electron-vite`), `recharts` for the donut, `rss-parser` for feeds, `lucide-react` for icons.
- **No native modules**, so `npm install` stays painless on Windows.
- **Data storage:** your holdings + settings live in `portfolio.json` inside the OS per-user app directory (e.g. `%APPDATA%/dhan-advisor` on Windows). It is never committed.
- **Security:** `contextIsolation` on, no `nodeIntegration` in the renderer, a strict CSP, and external article links open in your real browser — never inside the app.

---

## Extending it

- **Add stocks** to the universe in `src/main/services/stockUniverse.ts`.
- **Add a news source** in `src/main/services/sources.ts` (give it an honest trust weight and a working RSS URL).
- **Live prices:** the app is structured so a market-data provider can be slotted in later — drop a key in `.env` (see `.env.example`) and wire a fetcher next to `newsFetcher.ts`. Out of the box, Dhan Advisor needs **no API key**.

---

## Disclaimer

Dhan Advisor is provided for **educational and informational purposes only**. It is not a SEBI-registered investment adviser, broker, or research analyst, and it does not provide personalised investment advice. The suggestions, scores, and rebalancing notes are generated by transparent heuristics over public information and may be incomplete or wrong. Past performance and news coverage are not indicators of future results. **You are solely responsible for your investment decisions.** Consult a qualified, SEBI-registered financial adviser before investing.

## License

MIT — see [LICENSE](LICENSE).
