-- WeChat official accounts are no longer collected: the lookup index 0123 added goes with them.
DROP INDEX CONCURRENTLY IF EXISTS articles_wechat_external_id_idx;
