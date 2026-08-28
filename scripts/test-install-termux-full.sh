#!/usr/bin/env sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
work_dir=$(mktemp -d)
cleanup() { rm -rf "$work_dir"; }
trap cleanup EXIT INT TERM

mkdir -p "$work_dir/bin" "$work_dir/prefix/bin" "$work_dir/home"
cat > "$work_dir/bin/pkg" <<'EOF'
#!/usr/bin/env sh
exit 0
EOF
chmod 755 "$work_dir/bin/pkg"

archive="$work_dir/kalix-code.zip"
cd "$repo_dir"
tree=$(git write-tree)
git archive --format=zip --prefix=Kalix-code-master/ "$tree" -o "$archive"

export PATH="$work_dir/bin:$PATH"
export HOME="$work_dir/home"
export PREFIX="$work_dir/prefix"
export KALIX_HOME="$work_dir/kalix-home"
export KALIX_MIN_FREE_KB=1
export KALIX_ARCHIVE_URL="file://$archive"

sh "$repo_dir/scripts/install-termux.sh"
test -x "$PREFIX/bin/kalix"
test -f "$KALIX_HOME/source/apps/web/dist/index.html"
printf 'Full local Termux installer test passed.\n'
