#!/bin/sh
crond -b -l 8 2>/dev/null || true
exec node server.js
