#!/bin/sh
# Forced command for the deploy key on the CDN server. Install it outside the served
# folder, owned by root, and point the key's authorized_keys line at it:
#
#   restrict,command="/usr/local/bin/cdn-ssh-gate /path/to/serve" ssh-ed25519 AAAA... cdn-deploy
#
# The key can then do only two things: write into the served folder without deleting
# (rrsync -wo -no-del, which needs rsync 3.2.4 or newer), and rebuild index.json.
set -eu

SERVE=${1:?usage: cdn-ssh-gate <served folder>}

case "${SSH_ORIGINAL_COMMAND:-}" in
  'rsync --server '*)
    exec rrsync -wo -no-del "$SERVE"
    ;;
  cdn-reindex)
    cd "$SERVE"
    find . -mindepth 2 -type f \( -iname '*.png' -o -iname '*.webp' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.gif' -o -iname '*.svg' \) -printf '%h\t%f\n' \
      | sed 's|^\./||' | LC_ALL=C sort \
      | awk -F'\t' '
          function q(s) { gsub(/\\/, "\\\\", s); gsub(/"/, "\\\"", s); return "\"" s "\"" }
          BEGIN { printf "{\"dirs\":{" }
          {
            if ($1 != d) { if (d != "") printf "],"; printf "%s:[", q($1); d = $1; n = 0 }
            if (n++) printf ","
            printf "%s", q($2)
          }
          END { if (d != "") printf "]"; print "}}" }' > index.json.tmp
    chmod 644 index.json.tmp
    mv index.json.tmp index.json
    ;;
  *)
    echo 'cdn-ssh-gate: command refused' >&2
    exit 1
    ;;
esac
