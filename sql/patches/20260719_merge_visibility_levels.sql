START TRANSACTION;

UPDATE `document`
SET `visibility` = 1
WHERE `visibility` = 2;

UPDATE `team_setting`
SET `visibility` = 1
WHERE `visibility` = 2;

UPDATE `team_member_field`
SET `visibility` = 1
WHERE `visibility` = 2;

COMMIT;
