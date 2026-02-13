CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('cloudflare') NOT NULL DEFAULT 'cloudflare',
	`providerImageId` varchar(255) NOT NULL,
	`filename` varchar(255),
	`status` enum('pending','active','orphaned') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`mediaId` int NOT NULL,
	`role` enum('cover','gallery','detail') NOT NULL DEFAULT 'gallery',
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_media_id` PRIMARY KEY(`id`)
);
