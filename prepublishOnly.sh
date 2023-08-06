#!/bin/sh

# use nvm
. ~/.nvm/nvm.sh

echo "当前nvm版本"
nvm --version
echo $(whoami)

nvm use 14
if [[ $? -ne 0 ]]; then
    echo "node version 14 not exist, will install"
    nvm install 14
    nvm use 14
fi

echo "npm registry: "
echo $(npm config get registry)

npm config delete prefix
echo "npm global root path: "
echo "$(npm root -g)"

echo "node version: "
node -v

pversion=$(npx pnpm -v)

if [[ $pversion == 6* ]]; then
    echo "pnpm version is: $pversion"
else
    echo "pnpm version is not 6.0.0, will install pnpm"
    npm i -g pnpm@6
fi

npx pnpm install
