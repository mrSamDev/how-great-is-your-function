#!/usr/bin/env bash
# Blocks Bash tool calls that use npm or yarn instead of pnpm.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if echo "$COMMAND" | grep -qE '(^|[[:space:]&|;`])(npm|yarn)[[:space:]]'; then
  echo "Hook blocked: use pnpm instead of npm/yarn. Command was: $COMMAND" >&2
  exit 2
fi
