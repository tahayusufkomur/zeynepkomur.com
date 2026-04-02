CREATE TABLE `artwork_images` (
	`id` text PRIMARY KEY NOT NULL,
	`artwork_id` text NOT NULL,
	`image_path` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade
);
