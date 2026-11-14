---
expect:
  owner: fixture-org
  repo: market-observations
  path: captures/2026-11-13/morning.json
---
successfully downloaded text file (SHA: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb)

Resource contents (application/json), independently captured observation archive.
The fixed synthetic default branch and commit
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa contain the same file. This is an
archived capture, not a live web-fetch or Slack MCP endpoint. Historical evidence
comes from the captured pages and channel history, not from copying agent logs.

```json
{
  "data_origin": "synthetic",
  "snapshot_captured_at": "2026-11-13T10:03:00Z",
  "capture_id": "morning-2026-11-13",
  "public_pages": [
    {
      "url": "https://coast-stays.example/berlin",
      "captured_at": "2026-11-13T10:02:05Z",
      "http_status": 200,
      "body": "Coast Stays | CS-101 | Berlin | Entire apartment | 20–23 November 2026 | 2 guests | EUR 80 per night | EUR 20 one-time fee | Taxes included"
    },
    {
      "url": "https://urban-nests.example/berlin",
      "captured_at": "2026-11-13T10:02:06Z",
      "http_status": 200,
      "body": "Urban Nests | UN-201 | Berlin | Entire apartment | 20–23 November 2026 | 2 guests | EUR 95 per night | EUR 10 one-time fee | Taxes included"
    }
  ],
  "channel": {"id": "C0123456789", "name": "rental-market-intel"},
  "history": [
    {"captured_at": "2026-11-13T10:01:00Z", "messages": []},
    {
      "captured_at": "2026-11-13T10:03:00Z",
      "messages": [
        {
          "type": "message",
          "bot_id": "B0123456789",
          "ts": "1794564130.000100",
          "text": "# Berlin rental market — 13 November 2026\n20–23 November 2026 · 3 nights · 2 guests · entire apartments · EUR\n\n- Coast Stays: EUR 80/night × 3 + EUR 20 one-time fee = **EUR 260**.\n- Urban Nests: EUR 95/night × 3 + EUR 10 one-time fee = **EUR 295**.\n\nLowest observed total: Coast Stays, EUR 35 below Urban Nests.\nScope: the two configured public offers; prices include the stated fees. Cancellation policies were not compared."
        }
      ]
    }
  ],
  "coverage": "Two configured public pages and one fictional channel export. No observation of human readership, other offers, actual administrator approval, installed schedules or repeated unattended runs."
}
```
