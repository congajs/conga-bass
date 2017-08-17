/*
 * This file is part of the conga-bass library.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// native modules
var fs = require('fs');
var path = require('path');

// third-party modules
var Bass = require('bass').Bass;

// private bass module
var _bass = null;

var BassListener = function(){};

BassListener.prototype = {

    /**
     * Getter for service injection ${bass.listener::getBass}
     * @returns {Bass}
     */
    getBass: function() {
        return _bass;
    },

    /**
     * Configure and register bass
     *
     * @param {Object} event
     * @param {Function} next
     */
    onKernelCompile: function(event, next){

        var container = event.container;
        var config = container.get('config').get('bass');

        // attach logger
        if (typeof config.logging !== 'undefined' &&
            typeof config.logging.logger !== 'undefined')
        {
            // dynamically loading the attached logger by it's name, i.e. "@logger.default"
            config.logging.logger = container.get(config.logging.logger.substring(1));
        }

        var projectDir = container.getParameter('kernel.project_path');

        // check if there are any adapters defined
        if (!config.adapters){
            container.get('logger').error('No Bass.js adapters configured...skipping');
            next();
            return;
        }

        // fix adapter paths so that they're loaded from the node_modules directory of the current project
        // @todo - may need to also add a way to load them from the project's src/ directory
        config.adapters.forEach(function(adapter, index){

            const p = path.join(projectDir, 'node_modules', adapter);

            if (fs.existsSync(p)) {

                config.adapters[index] = p;

            } else {

                try {
                    require(path.join(adapter, 'lib', 'adapter'));
                    config.adapters[index] = adapter;
                } catch (err) {
                    throw new Error('bass adapter: ' + adapter + " can't be found at " + p + "!");
                }

            }

        });

        // fix model namespaces
        for (var i in config.managers) {

            const tempDocuments = {};

            for (var j in config.managers[i].documents) {
                let tempPath = container.get('namespace.resolver').resolveWithSubpath(config.managers[i].documents[j], 'lib');
                tempDocuments[this.findBundleNameFromPath(tempPath)] = tempPath;
            }

            config.managers[i].documents = tempDocuments;

            if (typeof config.managers[i].listeners !== 'undefined') {
                for (var name in config.managers[i].listeners){
                    config.managers[i].listeners[name].listener = container.get(config.managers[i].listeners[name].listener.replace('@', ''));
                }

                // convert the listeners object in to an array of objects
                config.managers[i].listeners = Object.keys(config.managers[i].listeners).map(function (key) {return config.managers[i].listeners[key]})
            }

        }

        // add custom annotation handlers
        var handlers = container.getTagsByName('bass.annotation.handler');

        if (handlers) {

            config.annotation = {
                handlers: []
            };

            handlers.forEach((handler) => {
                config.annotation.handlers.push(container.get(handler.getServiceId()));
            });

        }

        // create the bass.js instance with the configuration
        var bass = new Bass(config);

        // add bass instance to the app container
        container.set('bass', bass);

        // keep track of bass privately also
        _bass = bass;

        // initialize! and proceed!!!
        bass.init().then(function(){
            next();
        }, function(err){
            console.log(err);
            process.exit();
        });
    },

    /**
     * Find the bundle name from a full file path
     *
     * @param  {String} path
     * @return {String}
     */
    findBundleNameFromPath: function(filePath) {

        const parts = filePath.split(path.sep);

        let namespace = '';

        for (var i=0; i < parts.length; i++) {
            if (parts[i].endsWith('-bundle')) {
                namespace = parts[i];
            }
        }

        if (parts[parts.length - 1].endsWith('.js')) {
            namespace += ':' + parts[parts.length - 1].replace('.js', '');
        }

        return namespace;
    }
};

module.exports = BassListener;
