/*
 * This file is part of the conga-bass library.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The AbstractFixture is the parent class for all Fixtures which sets up the fixture
 * and provides methods to load data, etc.
 */
module.exports = class FixtureRegistry {

    /**
     * Construct the registry
     */
    constructor() {
        this.models = {}
    }

    /**
     * Add a model
     *
     * @param  {String} name   the reference name
     * @param  {Object} model  the model object
     * @return {void}
     */
    add(name, model) {
        this.models[name] = model;
    }

    /**
     * Get a model
     *
     * @param  {String} name the name of the reference
     * @return {Object}      the model object
     */
    get(name) {
        return this.models[name];
    }
}
