#!/usr/bin/env bash
# Empties every table of every healthcare_* database (schemas stay) and clears uploaded files and the local outbox.
# Safe to run while the services are up.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DBS=$(docker exec healthcare-mysql mysql -uroot -phealthcare_root -N -e "SHOW DATABASES LIKE 'healthcare\_%'" 2>/dev/null)
for db in $DBS; do
  TABLES=$(docker exec healthcare-mysql mysql -uroot -phealthcare_root -N -e "SHOW TABLES FROM \`$db\`" 2>/dev/null)
  STMT="SET FOREIGN_KEY_CHECKS=0;"
  for t in $TABLES; do
    if [[ "$t" == *_seq ]]; then STMT+=" DELETE FROM \`$db\`.\`$t\`; INSERT INTO \`$db\`.\`$t\` VALUES (1);"  # Hibernate id-sequence tables need their single row
    else STMT+=" TRUNCATE TABLE \`$db\`.\`$t\`;"; fi
  done
  STMT+=" SET FOREIGN_KEY_CHECKS=1;"
  docker exec healthcare-mysql mysql -uroot -phealthcare_root -e "$STMT" 2>/dev/null
done
rm -rf "$ROOT/docs/.run/storage"/* 2>/dev/null || true
curl -s -X DELETE http://localhost:5300/v1/outbox >/dev/null 2>&1 || true
# Hibernate keeps a pool of ids for tables that use a sequence table (community reactions); restart that
# service so its pool matches the reset table.
"$ROOT/docs/scripts/backend.sh" restart community >/dev/null 2>&1 || true
echo "data cleared"
