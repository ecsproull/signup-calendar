#!/bin/bash

set -e

DRYRUN=""

if [[ "$1" == "-n" ]]; then
    DRYRUN="--dry-run"
    echo "***** DRY RUN *****"
fi

LOCAL="/var/www/wordpress/wp-content/plugins/signup-calendar/"
REMOTE="scwwoodshop:~/public_html/wp-content/plugins/signup-calendar/"

rsync -rvc $DRYRUN \
    --delete \
    --itemize-changes \
    \
    "$LOCAL/js/" \
    "$REMOTE/js/"

rsync -rvc $DRYRUN \
    --delete \
    --itemize-changes \
    \
    "$LOCAL/css/" \
    "$REMOTE/css/"

rsync -rvc $DRYRUN \
    --delete \
    --itemize-changes \
    \
    "$LOCAL/src/" \
    "$REMOTE/src/"



rsync -rvc $DRYRUN \
    --itemize-changes \
    \
    "$LOCAL/signup-calendar.php" \
    "$REMOTE/"