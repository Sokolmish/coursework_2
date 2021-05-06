#!/bin/bash
mysql -uroot -p$MYSQL_ROOT_PASSWORD < 1_tables.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD < 2_views.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD < 3_indexes.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD < 4_procedures.sql
