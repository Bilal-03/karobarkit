-- SQLite; load an authorized, normalized event-level export privately.
-- No real participant/contact records belong in this database or repository.
CREATE TABLE IF NOT EXISTS events (
  event_name TEXT NOT NULL, session_id TEXT NOT NULL, tool_id TEXT,
  channel TEXT NOT NULL, occurred_at TEXT NOT NULL, elapsed_ms INTEGER
);

-- Funnel: order the export after its start; deduplicate session/tool pairs.
WITH starts AS (
 SELECT session_id, tool_id, MIN(occurred_at) AS started_at
 FROM events WHERE event_name='tool_started' GROUP BY session_id, tool_id
), funnel AS (
 SELECT s.session_id,s.tool_id, MAX(CASE WHEN e.event_name='result_downloaded'
   AND e.occurred_at>=s.started_at THEN 1 ELSE 0 END) AS exported
 FROM starts s LEFT JOIN events e ON e.session_id=s.session_id AND e.tool_id=s.tool_id
 GROUP BY s.session_id,s.tool_id
)
SELECT tool_id,COUNT(*) AS started_sessions,SUM(exported) AS exported_sessions,
 1.0*SUM(exported)/NULLIF(COUNT(*),0) AS completion_rate
FROM funnel GROUP BY tool_id;

-- Channel activation proxy: sessions with any document export, not people.
SELECT channel,COUNT(DISTINCT session_id) AS exporting_sessions
FROM events WHERE event_name='result_downloaded' AND tool_id IN
 ('quotation-generator','invoice-generator','gst-invoice-generator','payment-receipt-generator')
GROUP BY channel;

-- Repeated document exports within a tab session; NOT cross-visit retention.
SELECT session_id,COUNT(DISTINCT tool_id) AS document_types_exported
FROM events WHERE event_name='result_downloaded' AND tool_id IN
 ('quotation-generator','invoice-generator','gst-invoice-generator','payment-receipt-generator')
GROUP BY session_id HAVING COUNT(DISTINCT tool_id)>1;
