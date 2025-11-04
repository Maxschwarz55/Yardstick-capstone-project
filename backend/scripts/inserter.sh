#!/usr/bin/env bash
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "{\"ok\":true,\"ts\":\"$ts\",\"message\":\"noop run\"}"
exit 0
