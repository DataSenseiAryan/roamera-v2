ALTER TABLE `users` ADD `is_suspended` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `notif_prefs_user_event` ON `notification_prefs` (`user_id`,`event_type`);--> statement-breakpoint
CREATE INDEX `notif_user_read_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE INDEX `notif_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notices_active_idx` ON `system_notices` (`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `notice_dismissal_uniq` ON `user_notice_dismissals` (`user_id`,`notice_id`);