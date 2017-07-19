/*
 * This file is part of the conga-bass library.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');

const csv = require('csvtojson');
const StreamArray = require('stream-json/utils/StreamArray');

/**
 * The AbstractFixture is the parent class for all Fixtures which sets up the fixture
 * and provides methods to load data, etc.
 */
module.exports = class AbstractFixture {

    /**
     * Construct the fixture with a service container
     *
     * @param  {Container}       container
     * @param  {FixtureRegistry} registry
     */
    constructor(container, registry) {
        this.container = container;
        this.registry = registry;
        this.session = container.get('bass').createSession();
    }

    /**
     * Get the order index to run this fixture
     *
     * @return {Number}
     */
    getOrder() {
        return 1;
    }

    /**
     * Get the name of the model that this fixture is for
     *
     * @return {String}
     */
    getModelName() {
        return 'MyModelName';
    }

    /**
     * Get the current document manager
     *
     * @return {Manager}
     */
    getManager() {
        return this.session.getManagerForModelName(this.getModelName());
    }

    /**
     * Add a model reference
     *
     * @param  {String} name   the reference name
     * @param  {Object} model  the model object
     * @return {void}
     */
    addReference(name, model) {
        this.registry.add(name, model);
    }

    /**
     * Get a model reference
     *
     * @param  {String} name the name of the reference
     * @return {Object}      the model object
     */
    getReference(name) {
        return this.registry.get(name);
    }

    /**
     * Load the data into the database
     *
     * @param  {Function} next callback once done
     * @return {void}
     */
    load(next) {
        next();
    }

    /**
     * Run a mapper on data loaded from a file
     *
     * @param  {String}   file   the full file path to load
     * @param  {Function} mapper the mapper function
     * @param  {Function} next   the callback function
     * @return {void}
     */
    mapFromFile(file, mapper, next) {

        let index = 0;

        this.loadFile(file, (row) => {

            const model = this.getManager().createDocument(this.getModelName());

            mapper(model, row, index);

            index++;

        }, next);

    }

    /**
     * Load the rows from a file
     *
     * @param  {String}   file    the absolute path to file
     * @param  {Function} mapper  the mapper to run on each row
     * @param  {Function} next    the callback function
     * @return {void}
     */
    loadFile(file, mapper, next) {

        switch (path.extname(file)) {

            case '.json':

                const fileStream = fs.createReadStream(file);
                const jsonStream = StreamArray.make();

                let processingStream = new Writable({

                    write(object, encoding, callback) {
                        mapper(object.value);
                        callback();
                    },
                    objectMode: true
                });

                fileStream.pipe(jsonStream.input);
                jsonStream.output.pipe(processingStream);

                processingStream.on('finish', next);

                break;

            case '.csv':

                csv().fromFile(file).on('json', (row) => {
                    mapper(row);
                }).on('done', (error) => {
                    next();
                });

                break;
        }
    }
}
