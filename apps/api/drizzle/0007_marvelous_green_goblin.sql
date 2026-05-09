CREATE TABLE `journey_contributors` (
	`journey_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'contributor' NOT NULL,
	`invited_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journey_contributor_uniq` ON `journey_contributors` (`journey_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `journey_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`caption` text,
	`taken_at` integer,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `journey_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `journey_trip_links` (
	`journey_id` text NOT NULL,
	`trip_id` text NOT NULL,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journey_trip_link_uniq` ON `journey_trip_links` (`journey_id`,`trip_id`);--> statement-breakpoint
ALTER TABLE `journey_entries` ADD `updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL;--> statement-breakpoint
ALTER TABLE `journeys` ADD `layout_pref` text DEFAULT 'magazine' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `user_badge_uniq` ON `user_badges` (`user_id`,`badge_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `visited_country_uniq` ON `visited_countries` (`user_id`,`country_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `visited_region_uniq` ON `visited_regions` (`user_id`,`region_code`);