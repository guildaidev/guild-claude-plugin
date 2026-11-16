---
expect:
  session_id: "11111111-2222-4333-8444-555555555555"
  user_event_id: "fixture-user-event"
  after_event_id: "fixture-before-input"
---
{"synthetic":true,"wait_complete":true,"status":"DONE","session_id":"11111111-2222-4333-8444-555555555555","root_task_id":"66666666-7777-4888-8999-aaaaaaaaaaaa","completion_scope":"root_task_state","message_consumed":"unconfirmed","event":{"id":"event-root-done","type":"runtime_done","created_at":"2026-01-02T12:00:21.000Z","task":{"id":"66666666-7777-4888-8999-aaaaaaaaaaaa","status":"DONE"},"content":{"document_id":"fixture-timeline-document","document_url":"https://docs.google.com/document/d/fixture-timeline-document/edit","reported_second_source":"battery-label"}}}
