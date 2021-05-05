USE cwork2_db;

-- -- UsersRegDataView

-- CREATE VIEW UsersRegDataView AS
--     SELECT u.user_id, u.username, u.email, u.date_reg, u.birthday, a.passwd, a.salt
-- 	FROM Users as u INNER JOIN Auth as a ON u.user_id = a.user_id

-- -- CREATE TRIGGER UsersRegDataView_insert
