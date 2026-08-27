CREATE TABLE `model_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`baseUrl` varchar(1024) NOT NULL,
	`protocol` enum('openai') NOT NULL DEFAULT 'openai',
	`apiKeyCiphertext` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `model_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `model_providers_user_display_name_unique` UNIQUE(`userId`,`displayName`)
);
--> statement-breakpoint
CREATE TABLE `provider_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` int NOT NULL,
	`modelId` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`source` enum('discovered','manual') NOT NULL DEFAULT 'discovered',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provider_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_models_provider_model_id_unique` UNIQUE(`providerId`,`modelId`)
);
--> statement-breakpoint
ALTER TABLE `model_providers` ADD CONSTRAINT `model_providers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `provider_models` ADD CONSTRAINT `provider_models_providerId_model_providers_id_fk` FOREIGN KEY (`providerId`) REFERENCES `model_providers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `model_providers_user_id_idx` ON `model_providers` (`userId`);--> statement-breakpoint
CREATE INDEX `provider_models_provider_id_idx` ON `provider_models` (`providerId`);