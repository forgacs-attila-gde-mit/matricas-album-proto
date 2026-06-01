$ErrorActionPreference = "Stop"

# Workaround for Docker Compose buildx/bake failing on the accented project path.
# Error: header key "x-docker-expose-session-sharedkey" contains value with non-printable ASCII characters
$env:COMPOSE_BAKE = "false"

docker compose up --build
