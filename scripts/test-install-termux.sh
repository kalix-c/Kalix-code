#!/usr/bin/env bash
# Hermetic smoke test for the Termux installer; no Android packages or network required.
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
work=$(mktemp -d)
cleanup() { rm -rf "$work"; }
trap cleanup EXIT

fixture="$work/fixture/Kalix-code-master"
mkdir -p "$fixture" "$work/bin" "$work/prefix/bin"
printf '{"name":"kalix-code-fixture"}\n' > "$fixture/package.json"
(cd "$work/fixture" && zip -qr "$work/kalix-code.zip" Kalix-code-master)

cat > "$work/bin/pkg" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$work/bin/corepack" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$work/bin/pnpm" <<'EOF'
#!/bin/sh
printf '%s\n' "$*" > "$KALIX_TEST_PNPM_ARGS"
EOF
cat > "$work/bin/curl" <<'EOF'
#!/bin/sh
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then output=$2; shift 2; continue; fi
  shift
done
cp "$KALIX_TEST_ARCHIVE" "$output"
EOF
cat > "$work/bin/unzip" <<'EOF'
#!/bin/sh
exec /usr/bin/unzip "$@"
EOF
chmod 755 "$work/bin"/*

HOME="$work/home" \
KALIX_HOME="$work/kalix-home" \
PREFIX="$work/prefix" \
TMPDIR="$work/tmp" \
KALIX_TEST_ARCHIVE="$work/kalix-code.zip" \
KALIX_TEST_PNPM_ARGS="$work/pnpm-install.txt" \
PATH="$work/bin:$PATH" \
  sh "$root/scripts/install-termux.sh"

test -f "$work/kalix-home/source/package.json"
grep -q -- '--ignore-scripts' "$work/pnpm-install.txt"
test -x "$work/prefix/bin/kalix"
KALIX_TEST_PNPM_ARGS="$work/pnpm-launch.txt" PATH="$work/bin:$PATH" sh "$work/prefix/bin/kalix" web --background
grep -q -- 'kalix web --background' "$work/pnpm-launch.txt"
printf 'Termux installer smoke test passed.\n'
