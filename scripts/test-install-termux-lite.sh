#!/usr/bin/env sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
work_dir=$(mktemp -d)
cleanup() { rm -rf "$work_dir"; }
trap cleanup EXIT INT TERM

mkdir -p "$work_dir/bin" "$work_dir/prefix/bin"
cat > "$work_dir/bin/termux-open-url" <<'EOF'
#!/usr/bin/env sh
printf '%s\n' "$1" > "$KALIX_TEST_OPENED_URL"
EOF
chmod 755 "$work_dir/bin/termux-open-url"

export PATH="$work_dir/bin:$PATH"
export PREFIX="$work_dir/prefix"
export KALIX_TEST_OPENED_URL="$work_dir/opened-url.txt"
export KALIX_CLOUD_URL="https://example.test/kalix"

sh "$repo_dir/scripts/install-termux.sh" > "$work_dir/install.log"
test -x "$PREFIX/bin/kalix"
sh "$PREFIX/bin/kalix" web --background
test "$(cat "$KALIX_TEST_OPENED_URL")" = "$KALIX_CLOUD_URL"
test "$(sh "$PREFIX/bin/kalix" url)" = "$KALIX_CLOUD_URL"
printf 'Lightweight Termux launcher test passed.\n'
