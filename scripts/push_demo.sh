#!/bin/bash

## Automatically pushes the current branch to the calchart-viewer-demo repo, where
## the branch could be viewed at calband.github.io/calchart-viewer-demo.

# if any files have changed, don't run script
if [[ ! -z $(git status --porcelain) ]]; then
    echo "You have modified/untracked files!"
    return 1
fi

# http://stackoverflow.com/a/12142066/4966649
CURR_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Force creation of a new branch..."
if git branch | grep -q demo-master; then
    git branch -qD demo-master
fi
git checkout -qb demo-master

echo "Editing .gitignore..."
rm .gitignore
echo "node_modules" > .gitignore

echo "Building and committing static files..."
grunt build > /dev/null # hide output
git add . > /dev/null # hide output
git commit -qm "Build static files for demo"

echo "Pushing to demo repo..."
if ! git remote | grep -q demo; then
    # have user do it just in case user does not have permission to add calchart-viewer-demo
    echo "Please add the demo repo with 'git remote add demo <git-url>'"
    return 1
fi
git push -fq demo demo-master:master

echo "Cleaning up..."
git checkout -q $CURR_BRANCH
git branch -Dq demo-master

echo "Rebuilding current branch..."
grunt build > /dev/null # hide output

echo "done."
