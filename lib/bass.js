/*
 * This file is part of the conga-bass library.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// native modules
var path = require('path');

// third-party modules
var Bass = require('bass');

var BassListener = function(){};

BassListener.prototype = {

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
			config.adapters[index] = path.join(projectDir, 'node_modules', adapter);
		});

		// fix model namespaces
		for (var i in config.managers){
			for (var j in config.managers[i].documents){
				config.managers[i].documents[j] 
					= container.get('namespace.resolver').resolveWithSubpath(config.managers[i].documents[j], 'lib');
			}
		}

		// create the bass.js instance with the configuration
		var bass = new Bass(config);

		// add bass instance to the app container
		container.set('bass', bass);

		// initialize! and proceed!!!
		bass.init().then(function(){
			next();
		});
	}
};

module.exports = BassListener;