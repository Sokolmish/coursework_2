DELIMITER //

-- TODO: transactions?

CREATE PROCEDURE CreateUser (
    iusername varchar(32),
    iemail varchar(320),
    ipasswd binary(32),
    isalt binary(32)
)
BEGIN
    INSERT INTO Users(`username`, `email`, `date_reg`) VALUES(iusername, iemail, CURRENT_TIMESTAMP);
    INSERT INTO Auth(`user_id`, `passwd`, `salt`) VALUES(LAST_INSERT_ID(), ipasswd, isalt);
END//

CREATE PROCEDURE Authorize (
    iuser_id int,
    iaceess binary(32),
    irefresh binary(32)
)
BEGIN
    INSERT INTO AuthSessions(`user_id`, `access_token`, `refresh_token`, `time_grant`)
        VALUES(iuser_id, iaceess, irefresh, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY
        UPDATE access_token=iaceess, refresh_token=irefresh, time_grant=CURRENT_TIMESTAMP;
END//

CREATE PROCEDURE Deauthorize (
    iuser_id int
)
BEGIN
    DELETE FROM AuthSessions WHERE user_id = iuser_id;
END//

CREATE PROCEDURE CreatePost (
    iuser_id int,
    ititle varchar(128),
    icontent text,
    itags text
)
BEGIN
    INSERT INTO Posts(`author`, `date`, `title`, `content`)
        VALUES(iuser_id, CURRENT_TIMESTAMP, ititle, icontent);
    INSERT INTO TagsAssign(`tag_id`, `post_id`)
        SELECT `tag_id`, LAST_INSERT_ID() AS post_id
        FROM Tags WHERE FIND_IN_SET(`tagname`, itags);
END//

CREATE PROCEDURE CreateComment (
    iuser_id int,
    ipost int,
    icontent text
)
BEGIN
    INSERT INTO Comments(`author`, `date`, `post`, `content`)
        VALUES(iuser_id, CURRENT_TIMESTAMP, ipost, icontent);
END//

CREATE PROCEDURE DoVote (
    iuser_id int,
    ipost_id int,
    iis_up boolean
)
BEGIN
    IF EXISTS (
        SELECT `p_vote_id` FROM PostVotes WHERE `post_id` = ipost_id AND `user_id` = iuser_id
    ) THEN
        IF (SELECT `is_up` FROM PostVotes WHERE `post_id` = ipost_id AND `user_id` = iuser_id) THEN
            UPDATE Posts SET `upvotes` = `upvotes` - 1 WHERE `post_id` = ipost_id;
        ELSE
            UPDATE Posts SET `downvotes` = `downvotes` - 1 WHERE `post_id` = ipost_id;
        END IF;
        DELETE FROM PostVotes WHERE `post_id` = ipost_id AND `user_id` = iuser_id;
        -- TODO: Update instead of delete
    END IF;
    INSERT INTO PostVotes(`user_id`, `post_id`, `is_up`)
        VALUES(iuser_id, ipost_id, iis_up);
    IF iis_up THEN
        UPDATE Posts SET `upvotes` = `upvotes` + 1 WHERE `post_id` = ipost_id;
    ELSE
        UPDATE Posts SET `downvotes` = `downvotes` + 1 WHERE `post_id` = ipost_id;
    END IF;
END//
