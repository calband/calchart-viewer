#!/bin/bash

# Automatically pushes the master branch to the gh-pages branch on Github. To
# run this script, call `source scripts/push.sh`

# make sure we're in the root directory
if [[ ! -d .git ]]; then
    echo "ERROR: Please run this script in the root directory."
    return 1
fi

# make sure we're on the master branch
if ! grep -q "master" .git/HEAD; then
    echo "ERROR: Please go to the master branch."
    return 1
fi

# make sure master is up to date
git pull origin master

# checkout and update the gh-pages branch
git fetch origin gh-pages
git checkout gh-pages
git pull origin gh-pages

# get the current hash
latest=$(git log -1 --format="%H")

# merge any updates from master
git merge master

master_hash=$(git log -1 --format="%H")
master_message=$(git log -1 --format="%B")

# build static files
grunt build

# squash commits
git reset --soft $latest
git commit -m "Built up to $master_hash ($master_message)"
git push origin gh-pages

git checkout master
echo "done."
