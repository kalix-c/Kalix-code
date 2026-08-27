CREATE TABLE `github_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenCiphertext` text NOT NULL,
	`githubLogin` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `github_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_connections_user_id_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `provider_models` ADD `pricingTier` enum('unknown','free','paid') DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `github_connections` ADD CONSTRAINT `github_connections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;