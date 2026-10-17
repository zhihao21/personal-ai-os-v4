# Daily journal preservation format

Daily journals remain separate from Emotional Aftereffect events. The `lib/journal.mjs` schema is a lossless, private JSON container for source pages:

```json
{
  "schemaVersion": 1,
  "entries": [{
    "id": "synthetic-page",
    "date": {"value": "2026-10-16", "precision": "day"},
    "source": {"system": "notion", "page": {"id": "synthetic-page", "properties": {}}}
  }]
}
```

`source.page` must contain the entire original page object, including all properties and unknown metadata. The copied `id` must match the source page ID. `date` is `null` when the source date is unavailable; a date-only value remains `YYYY-MM-DD` with `precision: "day"`. Use `precision: "instant"` only for an observed timestamp with an explicit timezone. Never add midnight to a date-only journal. The container does not interpret the meaning or scale of mood/state numbers, labels, formulas or text. It has no peak timestamp, event lifecycle, risk factors or followup relation. Conflict-safe merge rejects changed IDs instead of overwriting source records.

No live Notion import is implemented. Before a private import preview, confirm full source property IDs, numeric scales, timezone rules and whether the connection returns complete page properties. Paginated properties must be fetched fully before calling a source page complete. Preserve raw source exports outside this public repository. The synthetic tests verify roundtrip preservation and malformed/ambiguous date rejection; they contain no personal records.
