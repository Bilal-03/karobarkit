-- SQLite. Use only the clearly labeled simulated JSON downloaded from the case study.
-- Load the JSON text through a bound parameter, not shell interpolation.
-- Example Python: connection.execute(query, {'events_json': downloaded_text})
WITH events AS (
 SELECT json_extract(value,'$.session') AS session,
        json_extract(value,'$.channel') AS channel,
        json_extract(value,'$.stage') AS stage,
        json_extract(value,'$.atMs') AS at_ms
 FROM json_each(:events_json)
), starts AS (
 SELECT session,channel,MIN(at_ms) AS started_at FROM events
 WHERE stage='started' GROUP BY session,channel
), results AS (
 SELECT s.session,s.channel,s.started_at,MIN(e.at_ms) AS result_at
 FROM starts s LEFT JOIN events e ON e.session=s.session AND e.channel=s.channel
 AND e.stage='result' AND e.at_ms>=s.started_at GROUP BY s.session,s.channel
), exports AS (
 SELECT r.session,r.channel,r.started_at,r.result_at,MIN(e.at_ms) AS export_at
 FROM results r LEFT JOIN events e ON e.session=r.session AND e.channel=r.channel
 AND e.stage='exported' AND e.at_ms>=r.result_at GROUP BY r.session,r.channel
)
SELECT channel,COUNT(*) AS starts,COUNT(result_at) AS results,COUNT(export_at) AS exports,
 1.0*COUNT(export_at)/NULLIF(COUNT(*),0) AS completion_rate
FROM exports GROUP BY channel;
-- No claims about people, retention, or causal improvements can be inferred.
