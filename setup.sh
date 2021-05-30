#!/bin/bash

echo -ne "* Creating the storage directory... \t\t"
mkdir -p ./user_storage
echo "[OK]"

echo -ne "* Creating the 'mysql_secret.env' file... \t"
cat > mysql_secret.env << EOF
MYSQL_ROOT_PASSWORD=<root_passwd>
MYSQL_USER=db_user
MYSQL_PASSWORD=<db_user_passwd>
EOF
echo "[OK]"

echo "Setup successfully finished"
echo "Now change default passwords in the 'mysql_secret.env' file!"
