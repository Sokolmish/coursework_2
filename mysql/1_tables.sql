CREATE TABLE Users (
    `user_id` int PRIMARY KEY AUTO_INCREMENT,
    `username` varchar(32) NOT NULL UNIQUE,
    `email` varchar(320) NOT NULL UNIQUE,
    `date_reg` datetime NOT NULL,
    `birthday` date,
    `avatar` varchar(32) DEFAULT 'default_avatar.png',
    `bio` varchar(512),
    CONSTRAINT CHECK (`username` <> ''),
    CONSTRAINT CHECK (`email` <> '')
);

CREATE TABLE Auth (
    `user_id` int PRIMARY KEY,
    `salt` binary(32) NOT NULL,
    `passwd` binary(32) NOT NULL,
    FOREIGN KEY(`user_id`) REFERENCES Users(`user_id`) ON DELETE CASCADE
);

CREATE TABLE AuthSessions (
    `user_id` int PRIMARY KEY,
    `access_token` binary(32) NOT NULL,
    `refresh_token` binary(32) NOT NULL,
    `time_grant` datetime NOT NULL,
    FOREIGN KEY(`user_id`) REFERENCES Users(`user_id`) ON DELETE CASCADE
);

CREATE TABLE Posts (
	`post_id` int PRIMARY KEY AUTO_INCREMENT,
    `author` int,
    `date` datetime NOT NULL,
    `title` varchar(128) NOT NULL,
    `content` text NOT NULL,
    `upvotes` int NOT NULL DEFAULT 0,
    `downvotes` int NOT NULL DEFAULT 0,
    FOREIGN KEY(`author`) REFERENCES Users(`user_id`) ON DELETE SET NULL,
    CONSTRAINT CHECK (`title` <> ''),
    CONSTRAINT CHECK (`content` <> ''),
    CONSTRAINT CHECK (`upvotes` >= 0),
    CONSTRAINT CHECK (`downvotes` >= 0)
);

CREATE TABLE Comments (
 	`comment_id` int PRIMARY KEY AUTO_INCREMENT,
    `author` int,
    `date` datetime NOT NULL,
    `post` int NOT NULL,
    `content` text NOT NULL,
    FOREIGN KEY(`author`) REFERENCES Users(`user_id`) ON DELETE SET NULL,
    FOREIGN KEY(`post`) REFERENCES Posts(`post_id`) ON DELETE CASCADE,
    CONSTRAINT CHECK (`content` <> ''),
);

CREATE TABLE Tags (
	`tag_id` int PRIMARY KEY AUTO_INCREMENT,
    `tagname` varchar(32) NOT NULL UNIQUE,
    CONSTRAINT CHECK (LENGTH(`tagname`) BETWEEN 2 AND 30)
);

CREATE TABLE PostVotes (
    `p_vote_id` int PRIMARY KEY AUTO_INCREMENT,
    `post_id` int NOT NULL,
    `user_id` int NOT NULL,
    `is_up` boolean NOT NULL,
    FOREIGN KEY(`post_id`) REFERENCES Posts(`post_id`) ON DELETE CASCADE,
    FOREIGN KEY(`user_id`) REFERENCES Users(`user_id`) ON DELETE CASCADE,
    UNIQUE KEY(`post_id`, `user_id`)
);

CREATE TABLE TagsAssign (
    `assign_id` int PRIMARY KEY AUTO_INCREMENT,
    `tag_id` int NOT NULL,
    `post_id` int NOT NULL,
    FOREIGN KEY(`tag_id`) REFERENCES Tags(`tag_id`) ON DELETE CASCADE,
    FOREIGN KEY(`post_id`) REFERENCES Posts(`post_id`) ON DELETE CASCADE
);
