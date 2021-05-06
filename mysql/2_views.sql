CREATE VIEW UsersAuthView AS
    SELECT u.user_id, u.email, LOWER(HEX(a.passwd)) as passwd, LOWER(HEX(a.salt)) as salt
    FROM Users as u INNER JOIN Auth as a ON u.user_id = a.user_id;
