CREATE TABLE `auth_lockouts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`created_at` text DEFAULT 'datetime(''now'')' NOT NULL,
	`updated_at` text DEFAULT 'datetime(''now'')' NOT NULL
);

CREATE UNIQUE INDEX `auth_lockouts_email_unique` ON `auth_lockouts` (`email`);
CREATE INDEX `auth_lockouts_email_idx` ON `auth_lockouts` (`email`);
CREATE INDEX `auth_lockouts_locked_until_idx` ON `auth_lockouts` (`locked_until`);
CREATE INDEX `auth_lockouts_email_lockout_idx` ON `auth_lockouts` (`email`,`locked_until`);
CREATE INDEX `auth_lockouts_attempt_count_idx` ON `auth_lockouts` (`attempt_count`);
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar` text,
	`role` text DEFAULT 'admin' NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT 'datetime(''now'')' NOT NULL,
	`updated_at` text DEFAULT 'datetime(''now'')' NOT NULL
);

CREATE UNIQUE INDEX `user_profiles_email_unique` ON `user_profiles` (`email`);
CREATE INDEX `user_profiles_email_idx` ON `user_profiles` (`email`);
CREATE INDEX `user_profiles_role_idx` ON `user_profiles` (`role`);
CREATE INDEX `user_profiles_email_role_idx` ON `user_profiles` (`email`,`role`);