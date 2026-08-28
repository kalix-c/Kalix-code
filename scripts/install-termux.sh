#!/data/data/com.termux/files/usr/bin/sh
# Kalix Code — full local Termux installer.
set -eu

REPOSITORY_ARCHIVE="${KALIX_ARCHIVE_URL:-https://github.com/kalix-c/Kalix-code/archive/refs/heads/master.zip}"
KALIX_HOME="${KALIX_HOME:-$HOME/.kalix}"
SOURCE_DIR="$KALIX_HOME/source"
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
MIN_FREE_KB="${KALIX_MIN_FREE_KB:-5242880}"
CACHE_DIR="$HOME/.cache/kalix"

say() { printf '[Kalix Code] %s\n' "$1"; }
fail() { printf '[Kalix Code] Error: %s\n' "$1" >&2; exit 1; }

available_kb=$(df -Pk "$HOME" | awk 'END { print $4 }')
case "$available_kb" in
  ''|*[!0-9]*) fail 'could not determine free storage space' ;;
esac
if [ "$available_kb" -lt "$MIN_FREE_KB" ]; then
  fail "full local Kalix needs at least 5 GB free; only $((available_kb / 1024 / 1024)) GB is available"
fi

say 'Installing Termux requirements…'
pkg install -y nodejs-lts curl unzip
command -v corepack >/dev/null 2>&1 || fail 'nodejs-lts did not provide Corepack'
corepack enable
corepack install

mkdir -p "$CACHE_DIR" "$KALIX_HOME" "$PREFIX/bin"
archive="$CACHE_DIR/kalix-code.zip"
staging="$KALIX_HOME/source.new"
rm -rf "$staging" "$archive"

say 'Downloading the complete local Kalix source…'
curl --fail --location --retry 8 --retry-delay 3 --retry-all-errors --connect-timeout 20 --max-time 900 "$REPOSITORY_ARCHIVE" -o "$archive"
unzip -q "$archive" -d "$staging"
extracted=$(find "$staging" -mindepth 1 -maxdepth 1 -type d -name 'Kalix-code-*' | head -n 1)
[ -n "$extracted" ] || fail 'downloaded archive did not contain Kalix Code'
rm -rf "$SOURCE_DIR"
mv "$extracted" "$SOURCE_DIR"
rm -rf "$staging" "$archive"

cd "$SOURCE_DIR"
[ -f apps/web/dist/index.html ] || fail 'the local web interface is missing from this release'
say 'Installing the local Kalix runtime…'
pnpm install --frozen-lockfile --ignore-scripts

cat > "$PREFIX/bin/kalix" <<EOF
#!/data/data/com.termux/files/usr/bin/sh
set -eu
export KALIX_HOME="${KALIX_HOME}"
cd "${SOURCE_DIR}"
exec pnpm kalix "\$@"
EOF
chmod 755 "$PREFIX/bin/kalix"

say 'Installed successfully. Start the local server with: kalix web --background'
