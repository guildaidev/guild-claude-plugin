// Service identity comes only from the validated destination, never artifact
// titles, narrative copy, media types, or a claimed integration name.
export function artifactSourceLink(artifact) {
  let url;
  try {
    if (typeof artifact.source_url !== 'string') return null;
    url = new URL(artifact.source_url);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
  } catch { return null; }
  const host = url.hostname.toLowerCase(), path = url.pathname;
  let target;
  if (host === 'docs.google.com') {
    target = [
      ['document', 'Google Doc'], ['spreadsheets', 'Google Sheet'],
      ['presentation', 'Google Slides'], ['forms', 'Google Form'], ['drawings', 'Google Drawing'],
    ].find(([route]) => new RegExp(`^/${route}/(?:u/\\d+/)?d/[^/]+(?:/|$)`).test(path))?.[1];
  } else if (host === 'drive.google.com') {
    target = /^\/file\/d\/[^/]+/.test(path) ? 'Google Drive file' : /^\/drive\/(?:u\/\d+\/)?folders\/[^/]+/.test(path) ? 'Google Drive folder' : undefined;
  } else if (host === 'slack.com' || host.endsWith('.slack.com')) {
    target = /^\/archives\/[^/]+\/p\d+/.test(path) ? 'Slack message' : undefined;
  } else if (host === 'github.com') {
    target = /^\/[^/]+\/[^/]+\/pull\/\d+(?:\/|$)/.test(path) ? 'GitHub pull request' : /^\/[^/]+\/[^/]+\/issues\/\d+(?:\/|$)/.test(path) ? 'GitHub issue' : undefined;
  } else if (host === 'notion.so' || host.endsWith('.notion.so') || host === 'notion.site' || host.endsWith('.notion.site')) {
    target = 'Notion page';
  } else if (host === 'linear.app') {
    target = /^\/[^/]+\/issue\/[^/]+/.test(path) ? 'Linear issue' : undefined;
  }
  // A captured document excerpt is not proof of a native document destination.
  // Generic web documents are pages, across providers. Only actual resource
  // routes/file suffixes identify a more specific resource; prose never does.
  const suffix = /\.([a-z0-9]+)$/i.exec(path)?.[1].toLowerCase();
  const file = { pdf: 'PDF', doc: 'Word document', docx: 'Word document', xls: 'spreadsheet', xlsx: 'spreadsheet', ppt: 'presentation', pptx: 'presentation', txt: 'text file', md: 'Markdown file', csv: 'CSV file', json: 'JSON file' }[suffix];
  const kind = /^(?:html?|xhtml)$/.test(suffix ?? '') || /^text\/html\b|^application\/xhtml\+xml\b/i.test(artifact.media_type ?? '') ? 'page'
    : file ?? { document: 'page', message: 'message', diff: 'diff', record: 'record', file: 'file', other: 'source artifact' }[artifact.kind] ?? 'source artifact';
  return { url: artifact.source_url, label: `Open ${target ?? kind}` };
}
