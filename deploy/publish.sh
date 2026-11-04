#!/usr/bin/env bash
# Publish the images, names and site files to the CDN, then rebuild the server's index.json.
# Never deletes on the server: game URLs must keep working. Run from the repository root.
set -euo pipefail

: "${CDN_HOST:?}" "${CDN_KEY_FILE:?}" "${CDN_KNOWN_HOSTS_FILE:?}"
CDN_USER=${CDN_USER:-deniz-cdn}
if [ "$CDN_USER" = root ]; then
  echo 'Refusing to deploy as root.' >&2
  exit 1
fi

ssh_cmd=(ssh -i "$CDN_KEY_FILE" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$CDN_KNOWN_HOSTS_FILE" -o ConnectTimeout=20)

# Content is compared by checksum because a fresh checkout has new timestamps. Without -t,
# unchanged files keep their server time, so browser caches stay valid. Without -l, links are skipped.
rsync -r --perms --chmod=D755,F644 --checksum --prune-empty-dirs --itemize-changes \
  -e "${ssh_cmd[*]}" \
  --include=/index.html --include=/docs.html --include=/catalog.js --include=/catalog.css \
  --include=/names/ --include='/names/*.json' \
  --include=/icons/ --include='/icons/**/' --include='/icons/**.webp' \
  --exclude='*' \
  ./ "$CDN_USER@$CDN_HOST:/"

"${ssh_cmd[@]}" "$CDN_USER@$CDN_HOST" cdn-reindex
