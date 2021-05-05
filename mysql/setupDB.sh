#!/bin/bash
mysql -uroot -p$MYSQL_ROOT_PASSWORD < tables.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD < views.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD < indexes.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD < procedures.sql
