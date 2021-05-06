#!/bin/bash
mysql -uroot -p$MYSQL_ROOT_PASSWORD -D$MYSQL_DATABASE < 1_tables.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD -D$MYSQL_DATABASE < 2_views.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD -D$MYSQL_DATABASE < 3_indexes.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD -D$MYSQL_DATABASE < 4_procedures.sql
