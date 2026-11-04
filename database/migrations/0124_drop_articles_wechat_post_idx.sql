-- WeChat official accounts are no longer collected: the lookup index 0121 added goes with them.
DROP INDEX CONCURRENTLY IF EXISTS articles_wechat_post_idx;
