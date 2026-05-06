ALTER TABLE `bucket_list` ADD `post_id` text REFERENCES posts(id);--> statement-breakpoint
CREATE INDEX `bucket_list_user_idx` ON `bucket_list` (`user_id`);--> statement-breakpoint
ALTER TABLE `posts` ADD `destinations` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `date_from` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `date_to` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `activities` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `accommodation` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `budget_inr` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `vacation_type` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `transport_mode` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `hashtags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `itinerary_json` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `cover_key` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `likes_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `comments_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `posts_user_idx` ON `posts` (`user_id`);--> statement-breakpoint
CREATE INDEX `posts_created_idx` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `posts_published_idx` ON `posts` (`is_published`);--> statement-breakpoint
CREATE INDEX `comments_post_idx` ON `comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `comments_parent_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE INDEX `post_photos_post_idx` ON `post_photos` (`post_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reactions_post_user_idx` ON `reactions` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `reactions_post_idx` ON `reactions` (`post_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `saved_posts_pk` ON `saved_posts` (`user_id`,`post_id`);