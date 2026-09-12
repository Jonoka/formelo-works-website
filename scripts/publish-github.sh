#!/usr/bin/env bash
# Run locally after reviewing the package and authenticating with GitHub CLI.
# This creates a NEW PRIVATE repository only. It never overwrites or deploys a site.
set -euo pipefail
fail() { printf 'STOP: %s\n' "$*" >&2; exit 1; }
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
REPO_NAME="${1:-formelo-works-website}"
EXPECTED_OWNER="${2:-Jonoka}"
[[ "$REPO_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ && ${#REPO_NAME} -le 100 ]] || fail 'Invalid repository name.'
[[ "$EXPECTED_OWNER" =~ ^[A-Za-z0-9][A-Za-z0-9-]*$ ]] || fail 'Invalid expected owner.'
for command in git gh python3; do
  command -v "$command" >/dev/null 2>&1 || fail "Install $command first; no remote changes were made."
done
cd "$ROOT"
export GH_HOST=github.com
gh auth status --hostname github.com >/dev/null 2>&1 || fail 'Authenticate locally: gh auth login --hostname github.com --web --git-protocol https --scopes workflow'
LOGIN="$(gh api --hostname github.com user --jq '.login')" || fail 'Could not verify GitHub account.'
[[ "$(printf '%s' "$LOGIN" | tr '[:upper:]' '[:lower:]')" == "$(printf '%s' "$EXPECTED_OWNER" | tr '[:upper:]' '[:lower:]')" ]] || fail "Authenticated account is $LOGIN, not $EXPECTED_OWNER. No repository was created."
FULL="$LOGIN/$REPO_NAME"
TOP="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -n "$TOP" ]]; then
  [[ "$(cd "$TOP" && pwd -P)" == "$ROOT" ]] || fail 'Unpack this project outside any existing Git repository.'
  BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
  [[ "$BRANCH" == main ]] || fail 'Existing local repository must be on main, not detached or another branch.'
  [[ -z "$(git remote)" ]] || fail 'An existing Git remote was found. Stop and inspect it; this script does not overwrite remotes.'
fi
python3 -S scripts/check_repository.py || fail 'Bootstrap validation failed. No repository was created.'
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
# A verified 404 is different from authentication, network or service failure.
if gh api --hostname github.com --include "repos/$FULL" >"$TMP/repo-response" 2>"$TMP/repo-error"; then
  fail "Repository $FULL already exists. It was not changed."
else
  if ! grep -Eq '^HTTP/[^ ]+ 404([[:space:]]|$)' "$TMP/repo-response"; then
    cat "$TMP/repo-error" >&2
    fail 'Could not establish repository absence. No create request was made.'
  fi
fi
if [[ -z "$TOP" ]]; then
  git init -b main || fail 'Could not initialize the local repository.'
fi
AUTHOR_NAME="$(git config user.name || true)"
AUTHOR_EMAIL="$(git config user.email || true)"
[[ -n "$AUTHOR_NAME" && -n "$AUTHOR_EMAIL" ]] || fail 'Set a local Git author, then rerun: git config user.name "Your name" ; git config user.email "Your GitHub noreply address". No remote repository was created.'
git add --all
if ! git diff --cached --quiet; then
  git commit -m 'chore: initialize factory website documentation and design assets'
fi
git rev-parse --verify HEAD >/dev/null || fail 'No initial local commit exists.'
printf 'Creating private repository: %s\n' "$FULL"
gh repo create "$FULL" --private --source "$ROOT" --remote origin \
  --description 'FORMELO WORKS B2B apparel factory website — documentation and selected design baseline; no public deployment.' \
  || fail 'Repository creation did not finish. Inspect GitHub and git remote before retrying; nothing will be overwritten automatically.'
PRIVATE="$(gh repo view "$FULL" --json isPrivate --jq '.isPrivate')" || fail 'Could not verify private visibility. No push was attempted.'
[[ "$PRIVATE" == true ]] || fail 'Private visibility was not confirmed. No files were pushed.'
# Read raw config, not a potentially rewritten transport URL.
REMOTE="$(git config --get remote.origin.url || true)"
case "$REMOTE" in
  "https://github.com/$FULL.git"|"git@github.com:$FULL.git"|"ssh://git@github.com/$FULL.git") ;;
  *) fail 'Unexpected remote URL. No files were pushed; inspect git remote.' ;;
esac
git push -u origin main || fail 'Push failed. The private repository may already exist; see docs/operations/runbook.md. Never force-push as recovery.'
LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git ls-remote --exit-code origin refs/heads/main | awk 'NR == 1 {print $1}')" || fail 'Push returned, but remote verification failed. Do not assume completion.'
[[ "$LOCAL_SHA" == "$REMOTE_SHA" ]] || fail 'Remote main differs from local HEAD; inspect before making further changes.'
gh repo edit "$FULL" --default-branch main || fail 'Files were pushed, but setting the default branch failed. Inspect before reporting completion.'
DEFAULT_BRANCH="$(gh repo view "$FULL" --json defaultBranchRef --jq '.defaultBranchRef.name')" || fail 'Could not verify the default branch.'
[[ "$DEFAULT_BRANCH" == main ]] || fail 'Remote default branch is not main. Inspect before continuing.'
PRIVATE="$(gh repo view "$FULL" --json isPrivate --jq '.isPrivate')" || fail 'Final visibility check failed; inspect the repository.'
[[ "$PRIVATE" == true ]] || fail 'Final repository visibility was not private. Inspect immediately; no site was deployed.'
printf '\nSUCCESS: https://github.com/%s\nVisibility: private\nBranch: main\nCommit: %s\n' "$FULL" "$LOCAL_SHA"
printf 'No website was deployed. Check GitHub Actions separately; no CI result is assumed here.\n'
