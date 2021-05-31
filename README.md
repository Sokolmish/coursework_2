# coursework_2

This is the coursework for course "Databases".

## Quick start

1. Run the following script:
```bash
./setup.sh
```
2. Change default passwords in the `mysql_secret.env` file.
3. To start application execute following commands:
```bash
docker-compose build
docker-compose up
```

Server will run on port 8091. It is specified in `docker-compose.yml` file.

After launching the forum will be available on http://localhost:8091.

PhpMyAdmin page will be available on http://localhost:8091/phpmyadmin/.

## Docker

Application consists of 4 containers:

1. database - container with mysql
2. server - main nodejs server
3. phpmyadmin - provides interface to database
4. nginx - provides access to static files and proxy for the main server
