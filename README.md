## Calchart Viewer

### Motivation
The goal of Calchart Viewer is to provide an easy way for Cal Band members to prepare for a performance by watching a preview of the charting file generated by Calchart. We aim to do this by building a web app which has three main features:

1. Provide a preview of the show, rendered in a web page.
2. Allow users to highlight their spot and step through the show with music.
3. Allow users to generate a PDF printout of their specific continuity (moves) for the show.

### Installing and building

1. Install [nodejs](http://nodejs.org/). Node comes packaged together with npm ("node package manager") on windows and mac. For linux, please see [this post](https://www.npmjs.org/doc/README.html).
2. Navigate to the project root in your terminal of choice.
3. `npm install`: this will install all the dependencies needed to compile the javascript in this project.
4. `npm install -g grunt-cli`: this will allow you to run grunt commands.
5. `grunt build`: this will compile the javascript into the `build/js/application.js` file. [Webpack](https://github.com/webpack/webpack) allows us to import things in javascript using the `require` function. See `app/js/application.js` and `app/js/viewer/ApplicationController.js` for an example. This will also compile the [LESS](http://lesscss.org/) code into the CSS files that the app needs to work.
6. Open `app/index.html` in your browser. Presto!

### Developing

When you change a javascript file, you will have to compile `build/js/application.js` again by running `grunt webpack:build`. Same thing with when you change a .less file: you'll need to run `grunt less` to compile to CSS. You should run `grunt watch` from the project root: this will start a task that listens for changes to the javascript and less files and autocompiles `build/js/application.js` and all the CSS files on every save.

#### Architecture Diagram

You can find a very high level overview of how the code architecture should work and interact with the UI [here](http://imgur.com/yw7FbWL.png).