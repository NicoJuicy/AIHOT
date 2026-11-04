-- WeChat official accounts are no longer collected: the lookup index 0122 added goes with them.
DROP INDEX CONCURRENTLY IF EXISTS articles_wechat_short_url_idx;
