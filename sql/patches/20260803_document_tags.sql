ALTER TABLE `document`
    ADD COLUMN `tags` JSON NULL COMMENT '文档标签' AFTER `content`;

ALTER TABLE `team_entity_profile`
    ADD COLUMN `document_tags` JSON NULL COMMENT '文档展示标签' AFTER `introduction_markdown`;
