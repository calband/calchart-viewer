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

echo "Updating master..."
git pull origin master -q

echo "Checking out gh-pages branch..."
git fetch origin gh-pages -q
git checkout gh-pages -q
git pull origin gh-pages -q

echo "Merging master..."
git merge master -q -m "Merging master into gh-pages branch"

echo "Building static files..."
grunt build > /dev/null # hide output

echo "Committing to gh-pages branch..."
git commit -am "Built production files" -q
git push origin gh-pages -q

git checkout master -q
echo "done."
