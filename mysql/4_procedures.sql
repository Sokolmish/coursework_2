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

CREATE PROCEDURE Authorize (
    iuser_id int,
    iaceess binary(32),
    irefresh binary(32)
)
BEGIN
    INSERT INTO AuthSessions(user_id, access_token, refresh_token, time_grant)
        VALUES(iuser_id, iaceess, irefresh, time_grant)
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
    icontent text
)
BEGIN
    INSERT INTO Posts(author, `date`, title, content)
        VALUES(iuser_id, CURRENT_TIMESTAMP, ititle, icontent);
END//

CREATE PROCEDURE CreateComment (
    iuser_id int,
    ipost int,
    icontent text
)
BEGIN
    INSERT INTO Comments(author, `date`, post, content)
        VALUES(iuser_id, CURRENT_TIMESTAMP, ipost, icontent);
END//

