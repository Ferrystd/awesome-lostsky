-- Breaking migration: pause chat workers and integration writes before running once.
-- Delete legacy webhook integrations (including soft-deleted rows), not virtual entities.
START TRANSACTION;
DELETE d FROM chat_webhook_delivery d
INNER JOIN team_virtual_integration i ON i.id = d.integration_id
WHERE i.driver = 'webhook' AND LEFT(i.signing_secret, 6) <> 'whsec_';
UPDATE chat_message m
INNER JOIN team_virtual_integration i ON i.id = m.origin_integration_id
SET m.origin_integration_id = NULL
WHERE i.driver = 'webhook' AND LEFT(i.signing_secret, 6) <> 'whsec_';
DELETE FROM team_virtual_integration
WHERE driver = 'webhook' AND LEFT(signing_secret, 6) <> 'whsec_';
COMMIT;
