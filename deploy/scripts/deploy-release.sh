#!/usr/bin/env sh
set -eu

release_dir=${1:?Release directory is required}
release_name=${2:?Release name is required}
export APP_RELEASE="$release_name"
shared_dir=/opt/training-platform/shared
env_file="$shared_dir/.env.production"
compose_file="$release_dir/compose.prod.yml"

# Ignore AppleDouble metadata if a release archive was created on macOS.
find "$release_dir" -type f -name '._*' -delete

if [ ! -f "$env_file" ]; then
  echo "Missing production environment file: $env_file" >&2
  exit 1
fi

docker compose \
  --project-directory "$release_dir" \
  --env-file "$env_file" \
  -f "$compose_file" \
  config --quiet

docker compose \
  --project-directory "$release_dir" \
  --env-file "$env_file" \
  -f "$compose_file" \
  up --detach --build --remove-orphans

attempt=1
while [ "$attempt" -le 24 ]; do
  if curl --fail --silent http://127.0.0.1:8080/frontend-health >/dev/null \
    && curl --fail --silent http://127.0.0.1:8080/api/health >/dev/null; then
    ln -sfn "$release_dir" /opt/training-platform/current
    echo "Release $release_name is healthy and active."
    exit 0
  fi
  sleep 5
  attempt=$((attempt + 1))
done

echo "Release $release_name failed its health checks." >&2
docker compose \
  --project-directory "$release_dir" \
  --env-file "$env_file" \
  -f "$compose_file" \
  ps
exit 1
