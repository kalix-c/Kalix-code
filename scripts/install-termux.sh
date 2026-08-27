#!/data/data/com.termux/files/usr/bin/sh
# Kalix Code installer for Termux. It intentionally uses a source archive instead
# of Git and skips optional native PTY dependencies unavailable on Android.
set -eu

REPOSITORY_ARCHIVE='https://github.com/kalix-c/Kalix-code/archive/refs/heads/master.zip'
INSTALL_DIR="${KALIX_HOME:-$HOME/.kalix}/source"
CACHE_DIR="${TMPDIR:-/tmp}/kalix-code-install"
ARCHIVE="$CACHE_DIR/kalix-code.zip"
UNPACK_DIR="$CACHE_DIR/unpacked"

say() {
  printf '%s\n' "[Kalix Code] $*"
}

if ! command -v pkg >/dev/null 2>&1; then
  printf '%s\n' 'This installer is for Termux. Install and open Termux, then run it again.' >&2
  exit 1
fi

say 'Installing Termux requirements…'
pkg update -y
pkg install -y nodejs-lts curl unzip

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  printf '%s\n' 'Node.js could not be installed. Run: pkg install nodejs-lts' >&2
  exit 1
fi

node -e '
  const [major, minor] = process.versions.node.split(".").map(Number)
  if (!(major >= 24 || (major === 22 && minor >= 19))) process.exit(1)
' || {
  printf '%s\n' "Kalix Code needs Node.js 22.19+ (or 24+); found $(node --version)." >&2
  exit 1
}

say 'Downloading Kalix Code…'
rm -rf "$CACHE_DIR"
mkdir -p "$CACHE_DIR"
curl -fL --retry 8 --retry-delay 3 --retry-all-errors --connect-timeout 20 --max-time 600 \
  "$REPOSITORY_ARCHIVE" -o "$ARCHIVE"
unzip -q "$ARCHIVE" -d "$UNPACK_DIR"
SOURCE_DIR=$(find "$UNPACK_DIR" -mindepth 1 -maxdepth 1 -type d -name 'Kalix-code-*' | head -n 1)

if [ -z "${SOURCE_DIR:-}" ] || [ ! -f "$SOURCE_DIR/package.json" ]; then
  printf '%s\n' 'Kalix Code archive is invalid or incomplete. Please run the installer again.' >&2
  exit 1
fi

rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$SOURCE_DIR" "$INSTALL_DIR"
cd "$INSTALL_DIR"

say 'Installing the lightweight Kalix runtime…'
if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack install
else
  npm install --global pnpm@11.7.0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  npm install --global pnpm@11.7.0
fi

pnpm install --frozen-lockfile --no-optional

if [ -n "${PREFIX:-}" ] && [ -d "$PREFIX/bin" ]; then
  cat > "$PREFIX/bin/kalix" <<EOF
#!/data/data/com.termux/files/usr/bin/sh
exec pnpm --dir "$INSTALL_DIR" kalix "\$@"
EOF
  chmod 755 "$PREFIX/bin/kalix"
fi

rm -rf "$CACHE_DIR"
say 'Installed successfully. Start Kalix with: kalix web --background'
