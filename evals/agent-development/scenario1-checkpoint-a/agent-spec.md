# Competitor scraping + Slack report

Source: the user-supplied business-user use-case slide, “05 · Business-user use
case”, HomeToGo POC. This file records requirements, not a generated narrative.

## What it does

Every morning, fetch competitors' public rental offers, compile comparative market
intelligence and post a readable Markdown report to a dedicated Slack channel.

## Evaluation goal

Pilot whether non-technical business users can build, configure and maintain the
agent logic themselves in Guild. A single synthetic visualization eval cannot
establish that broader usability result.

## Dependencies

- An org-wide Slack connection with actual administrator approval in a live setup.
  The slide names Anton's admin approval; this fixture does not claim that occurred.
- Reliable public-web fetching. Firecrawl was a temporary unblock in the slide,
  not a required new production connector for this visualization test.
- Scheduled triggers. This private-candidate test simulates one morning trigger;
  it does not install a schedule or demonstrate repeated unattended execution.

## Success criterion

Each morning, the unattended agent fetches every configured competitor, produces
an accurate like-for-like offer comparison and posts the readable Markdown report
to the configured Slack channel without manual fixes.

## Synthetic checkpoint instance

The fictional `market-monitor` agent compares two entire-apartment offers for
Berlin, 20–23 November 2026, two guests, in EUR. Coast Stays is EUR 80 per night
plus EUR 20 once (EUR 260 total). Urban Nests is EUR 95 per night plus EUR 10 once
(EUR 295 total). Both include taxes. The difference is EUR 35. Cancellation terms
are not compared. These illustrative prices and reserved `.example` URLs are
fixture data, not market facts from the slide or real competitor observations.

Raw session events include the fetch responses, calculation and Slack response.
A separate mocked GitHub file read returns independent captured pages and a
fictional before/after channel export. This is not a live Slack read, and archive
pinning alone does not prove authenticity, human readership or general reliability.
No bundle, selected timeline, copy/factual approval or HTML is supplied as input.
