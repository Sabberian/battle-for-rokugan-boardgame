#!/usr/bin/env bash
# Same delegation as panic-station-boardgame/deploy.sh. Register rokugan first.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PLATFORM="${PLATFORM_DIR:-$HERE/../zarya-boardgames-platform}"
: "${HOST:?Set HOST to the Zarya deployment SSH target}"
[ -f "$PLATFORM/deploy/game.sh" ] || { echo "Set PLATFORM_DIR to the platform checkout containing deploy/game.sh" >&2; exit 1; }
[ -z "$(git -C "$HERE" status --porcelain)" ] || { echo "Commit changes first: the platform deploys committed source." >&2; exit 1; }
cd "$PLATFORM"
exec bash deploy/game.sh "$HOST" rokugan "$@"
