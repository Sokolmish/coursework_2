USE cwork2_db;

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
    iusername varchar(32),
    ipasswd binary(32),
    isalt binary(32)
)
BEGIN
    SELECT user_id INTO @user_id FROM Users WHERE username = iusername;
    INSERT INTO Auth(user_id, salt, passwd) VALUES(@user_id, isalt, ipasswd);
END//
-- CALL Authorize ('delim', UNHEX('1234abcd1234abcd'), UNHEX('1234abcd1234abc0')) 

-- CreatePost

-- CreateComment
