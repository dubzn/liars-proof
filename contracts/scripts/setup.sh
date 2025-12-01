#!/bin/bash

set -e

profile="${1:-dev}"
deploy_all="${2:-false}"

if [ "$profile" != "dev" ] && [ "$profile" != "slot" ] && [ "$profile" != "testnet" ] && [ "$profile" != "mainnet" ]; then
    echo "Error: Invalid profile. Please use 'dev', 'slot', 'testnet', or 'mainnet'."
    exit 1
fi

if [ "$deploy_all" != "true" ] && [ "$deploy_all" != "false" ]; then
    echo "Error: Invalid deploy_all parameter. Please use 'true' or 'false'."
    exit 1
fi

echo "Deploying in ${profile}."

echo "Cleaning up build artifacts..."
rm -rf "target"

manifest_file="manifest_${profile}.json"
if [ -f "$manifest_file" ]; then
    echo "Removing manifest file: $manifest_file"
    rm -f "$manifest_file"
fi

echo "sozo build && sozo inspect && sozo migrate"
sozo -P ${profile} build && sozo -P ${profile} inspect && sozo -P ${profile} migrate

echo -e "\n✅ Deployed!"

world_address=$(sozo -P ${profile} inspect | awk '/World/ {getline; getline; print $3}')

if [ "$profile" == "dev" ]; then
    echo -e "\n🚀 Initializing Torii for ${profile}..."
    torii --world $world_address --http.cors_origins "*"
fi
