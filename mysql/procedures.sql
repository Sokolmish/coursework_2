USE cwork2_db;

DELIMITER //

CREATE PROCEDURE CreateUser (
    iusername varchar(32),
    iemail varchar(320),
    ipasswd binary(32),
    isalt binary(32)
)
BEGIN
    INSERT INTO Users(username, email, date_reg)
        VALUES(iusername, iemail, CURRENT_TIMESTAMP);
    INSERT INTO Auth(user_id, passwd, salt)
        VALUES(LAST_INSERT_ID(), ipasswd, isalt);
END//

-- CALL CreateUser ('delim', 'delim@ya.ru', UNHEX('1234abcd1234abcd'), UNHEX('1234abcd1234abc0')) 

