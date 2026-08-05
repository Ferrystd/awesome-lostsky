ALTER TABLE `team_member`
    DROP COLUMN `is_blocked`,
    ADD CONSTRAINT `chk_team_member_status` CHECK (`status` IN (1, 2, 3));
