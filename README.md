# pramaan schools

A two-view page for school heads and principals: the PRAMAAN eight-week pilot offer, and a sample cohort dashboard showing what a principal would see during a pilot.

**For:** principals and school heads of grades 6 to 8 (enterprise buyers of PRAMAAN).

**Hypothesis:** a principal understands the pilot offer in sixty seconds and sees the outcome story without explanation.

## open it

- live: https://ananyapradhan02.github.io/pramaan-schools/
- local: open `index.html` in a browser (works from `file://`, no server, no build)
- views: `#offer` (default), `#dashboard`, and a section drill-down such as `#dashboard/7A`

## what is in it

- **the offer:** the pilot in sixty seconds (what, who, how long, what you get, what you give, cost), the three steps of a pilot, what the school gets, the outcome report and its three instruments with sources, what we never do with child data, placeholder pricing, and "book a 20-minute call".
- **the instruments, named accurately:** CEI-II, the Curiosity and Exploration Inventory II (Kashdan et al., 2009); the Intrinsic Motivation Inventory short form (Ryan and Deci's self-determination theory work); academic efficacy items from the Patterns of Adaptive Learning Scales (Midgley et al., 2000), grounded in Bandura's self-efficacy theory.
- **the sample dashboard (mock data):** a fictional school, hill view school, with four sections (6A, 6B, 7A, 8A, 133 enrolled). Weekly class averages over eight weeks for curiosity, motivation and self-efficacy, inline SVG charts, per-section drill-down, a week-by-week table, notes (a monsoon week with closures), and CSV export via a Blob download.
- **child safety:** class aggregates only, no child names or child-level rows anywhere, a figure is held back when fewer than ten students answered (8A in week 5 shows this), no leaderboards, nothing tells a child how they did.

Nothing is scripted AI. The dashboard data is generated in the browser from a fixed seed (`20260706`), so every visitor sees the same numbers. Nothing is sent anywhere; the only thing stored is the theme choice in `localStorage`.

Prices on the page: ₹60,000 for the pilot, ₹1,500 per student per term after it. "book a 30-minute call" goes to Ananya's Calendly; "write to ananya" opens an email to ananyapradhan02@gmail.com. The page carries no placeholder or mock-data banners; the dashboard school (hill view school) and its numbers are illustrative, generated from a fixed seed.

## test script (for one real principal or school head, ten minutes)

Give them the live link on their phone, say nothing else, and time them.

1. After sixty seconds on the first screen: "in your own words, what would a pilot ask of your school, and what would you get back?" (listen for: two periods a week, eight weeks, a report on curiosity, motivation and self-efficacy.)
2. Open the sample dashboard: "which section would you ask your teachers about first, and why?" (listen for: 8A, flat motivation; whether they understood "held back" without help.)
3. "What would you need to see before you said yes to a pilot, and does ₹60,000 sound low, fair or high?"

## what Ananya should decide after testing

- Whether the sixty-second block does the job alone, or the offer needs a one-line outcome promise at the very top.
- Whether the price anchor is big enough (if nobody flinches at ₹60,000, test higher next time).
- Whether principals want the weekly dashboard at all, or only the week-8 report (which decides if the next build is the printable report or the ops board).

## contact

- book a call: https://calendly.com/ananyapradhan/30min
- write to ananya: ananyapradhan02@gmail.com

## status

v0.2 · 29.09.26 · banners removed, calendly and email wired in. MIT licence.
