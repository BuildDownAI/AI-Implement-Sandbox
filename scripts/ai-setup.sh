#!/usr/bin/env bash
# AI-Implement setup hook. Runs after the built-in install step, which is
# turned off for this repo by `packageManager: none` in .ai-implement/config.yml.
#
# This hook owns the dependency install. `--no-save` installs from package.json
# without rewriting package-lock.json, so the install never shows up as a
# change in the PR the pipeline opens.
echo "[ai-setup] custom install: npm install --no-save"
npm install --no-save --no-audit --no-fund
echo "[ai-setup] custom install finished"
