DELIMITER //

CREATE PROCEDURE CreateUser (
    iusername varchar(32),
    iemail varchar(320),
    ipasswd binary(32),
    isalt binary(32)
)
BEGIN
    INSERT INTO Users(username, email, date_reg) VALUES(iusername, iemail, CURRENT_TIMESTAMP);
    INSERT INTO Auth(user_id, passwd, salt) VALUES(LAST_INSERT_ID(), ipasswd, isalt);
END;
-- CALL CreateUser ('delim', 'delim@ya.ru', UNHEX('1234abcd1234abcd'), UNHEX('1234abcd1234abc0')) 

CREATE PROCEDURE Authorize (
    iuser_id int,
    iaceess binary(32),
    irefresh binary(32)
)
BEGIN
    INSERT INTO AuthSessions(user_id, access_token, refresh_token, time_grant)
        VALUES(iuser_id, iaceess, irefresh, time_grant)
        ON DUPLICATE KEY
        UPDATE access_token=iaceess, refresh_token=irefresh, time_grant=time_grant;
END//
-- CALL Authorize (4520, UNHEX('1234abcd1234abcd'), UNHEX('1234abcd1234abc0')) 

-- CreatePost

-- CreateComment
