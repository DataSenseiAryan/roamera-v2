CREATE TABLE `circle_message_reactions` (
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `circle_messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `circle_reaction_uniq` ON `circle_message_reactions` (`message_id`,`user_id`,`emoji`);--> statement-breakpoint
CREATE TABLE `circle_poll_votes` (
	`poll_id` text NOT NULL,
	`user_id` text NOT NULL,
	`option_index` integer NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `circle_polls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `circle_poll_vote_uniq` ON `circle_poll_votes` (`poll_id`,`user_id`,`option_index`);--> statement-breakpoint
CREATE TABLE `collab_message_reactions` (
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `collab_messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collab_reaction_uniq` ON `collab_message_reactions` (`message_id`,`user_id`,`emoji`);--> statement-breakpoint
CREATE TABLE `collab_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`reply_to_id` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reply_to_id`) REFERENCES `collab_messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collab_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text,
	`color` text DEFAULT '#ffffff',
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collab_poll_votes` (
	`poll_id` text NOT NULL,
	`user_id` text NOT NULL,
	`option_index` integer NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `collab_polls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collab_poll_vote_uniq` ON `collab_poll_votes` (`poll_id`,`user_id`,`option_index`);--> statement-breakpoint
CREATE TABLE `collab_polls` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`user_id` text NOT NULL,
	`question` text NOT NULL,
	`options_json` text NOT NULL,
	`is_multiple` integer DEFAULT false NOT NULL,
	`is_closed` integer DEFAULT false NOT NULL,
	`deadline` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `circle_member_uniq` ON `circle_members` (`circle_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `circle_messages` ALTER COLUMN "reply_to_id" TO "reply_to_id" text REFERENCES circle_messages(id) ON DELETE no action ON UPDATE no action;