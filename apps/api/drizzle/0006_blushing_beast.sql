CREATE TABLE `group_settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`settled_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `expense_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `expense_groups` ADD `linked_circle_id` text REFERENCES circles(id);--> statement-breakpoint
ALTER TABLE `expenses` ADD `category` text;--> statement-breakpoint
ALTER TABLE `expenses` ADD `notes` text;--> statement-breakpoint
CREATE UNIQUE INDEX `expense_group_member_uniq` ON `expense_group_members` (`group_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `expense_split_uniq` ON `expense_splits` (`expense_id`,`user_id`);