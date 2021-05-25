CREATE VIEW UsersAuthView AS
    SELECT u.user_id, u.email, LOWER(HEX(a.passwd)) as passwd, LOWER(HEX(a.salt)) AS salt
    FROM Users AS u INNER JOIN Auth AS a ON u.user_id = a.user_id;

CREATE VIEW PostsView AS
    SELECT p.post_id, u.user_id, u.username, p.`date`, p.title, p.content, (p.upvotes - p.downvotes) AS votes
    FROM `Posts` AS p INNER JOIN `Users` AS u ON p.author = u.user_id
    ORDER BY p.`date` DESC;

CREATE VIEW CommentsView AS
    SELECT c.comment_id, u.username, u.user_id, c.`date`, c.post, c.content
	FROM Comments AS c INNER JOIN Users AS u ON c.author = u.user_id
    ORDER BY c.`date` ASC;

CREATE VIEW TagsView AS
    SELECT t.tagname, a.post_id
    FROM Tags AS t INNER JOIN TagsAssign AS a ON t.tag_id = a.tag_id;
