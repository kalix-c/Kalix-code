#!/data/data/com.termux/files/usr/bin/sh
# Kalix Code — lightweight Termux launcher.
set -eu

PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
BIN_DIR="$PREFIX/bin"
LAUNCHER="$BIN_DIR/kalix"

mkdir -p "$BIN_DIR"

cat > "$LAUNCHER" <<'EOF'
#!/data/data/com.termux/files/usr/bin/sh
set -eu

KALIX_CLOUD_URL="${KALIX_CLOUD_URL:-https://kalixcode-lvx9ubmm.manus.space}"

case "${1:-web}" in
  web|open)
    if command -v termux-open-url >/dev/null 2>&1; then
      termux-open-url "$KALIX_CLOUD_URL"
    else
      printf 'Open Kalix Code in your browser: %s\n' "$KALIX_CLOUD_URL"
    fi
    ;;
  url)
    printf '%s\n' "$KALIX_CLOUD_URL"
    ;;
  help|--help|-h)
    printf '%s\n' 'Usage: kalix web | kalix url'
    ;;
  *)
    printf 'Unknown Kalix command: %s\n' "$1" >&2
    printf '%s\n' 'Usage: kalix web | kalix url' >&2
    exit 64
    ;;
esac
EOF

chmod 755 "$LAUNCHER"
printf 'Kalix Code is ready. Run: kalix web\n'
