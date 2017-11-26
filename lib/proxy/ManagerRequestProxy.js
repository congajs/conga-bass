/*
 * This file is part of the conga-bass library.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
const RequestProxy = require('./RequestProxy');

// framework libs
let CongaProfiler;
try {
    // safely and quietly attempt to load the profiler module
    CongaProfiler = require('@conga/framework-profiler');
} catch(e) { }

/**
 * Wrap a Bass Manager instance with a RequestProxy
 */
class ManagerRequestProxy extends RequestProxy {
    /**
     *
     * @param {Manager} manager The underlying bass manager instance
     * @param {Object} request The Conga request object
     * @param {Container} container The scoped service container
     */
    constructor(manager, request, container) {
        super(request, container);

        // NOTE: we have to manipulate our manager reference, this makes sure we don't alter the underlying instance
        this._manager = Object.create(manager);

        /* NOTE: overwrite the manager's getRepository method so that each repository has a reference to this manager
                 otherwise each repository gets a reference to the underlying manager and we won't capture hydration, etc  */
        this._manager.getRepository = this.getRepository.bind(this);

        // NOTE: proxy repositories are modified repositories from the underlying manager, so we keep an internal map
        this.repositories = {};

        // get a stopwatch section bound the current request
        this._stopwatch = container.has('profiler.stopwatch') && container.get('profiler.stopwatch').request(this._request);

        // get a reference to the bass data collector so we can collect information during the request
        this._collector = container.get('bass.profiler.collector');

        // wrap the underlying manager instance
        this.wrap(manager);
    }

    /**
     * Get the name of the adapter being used
     * @returns {String}
     */
    getAdapterName() {
        return this._manager.definition.adapter.name || 'bass';
    }

    /**
     * Get a stopwatch event
     * @param {String} name The event name
     * @returns {StopwatchEvent|false}
     */
    stopwatch(name) {
        const adapter = this.getAdapterName();
        return this._stopwatch && this._stopwatch.start(adapter + '.' + name, adapter);
    }

    /**
     * Collect data from a promise and stop the associated stopwatch
     * @param {Promise} promise
     * @param {StopwatchEvent|false} stopwatch The associated stopwatch event
     */
    promise(promise, stopwatch) {
        return promise
            .then(data => { stopwatch && stopwatch.stop(); return Promise.resolve(data) })
            .catch(err => { stopwatch && stopwatch.stop(); return Promise.reject(err) });
    }

    /**
     * Collect query data
     * @param {String} [repositoryName]
     * @param {String} queryName
     * @param {Object} [data]
     * @param {Promise} promise
     * @param {String} [stopwatchName]
     */
    saveQuery(repositoryName, queryName, data, promise, stopwatchName = null) {
        const stopwatch = this.stopwatch(
            stopwatchName || (repositoryName && repositoryName + '.') + queryName);

        // reference to the saved data object so we can modify it
        const saved = this._collector.saveQuery(this.getAdapterName(), queryName, data || {});

        return this.promise(promise, stopwatch).then((...args) => {
            saved.finished = CongaProfiler && CongaProfiler.Stopwatch.StopwatchPeriod.microtime();
            return Promise.resolve(...args);
        });
    }

    /* Overwritten Manager Methods */

    getRepository(name) {
        if (name in this.repositories) {
            return this.repositories[name];
        }
        // NOTE: call getRepository on the underlying manager because we overwrote it in our constructor
        const repository = Object.create(Object.getPrototypeOf(this._manager).getRepository.call(this._manager, name));
        // NOTE: set the manager reference to this instance so that we capture data hydration, etc.
        repository._setManager(this);
        this.repositories[name] = repository;
        return repository;
    }

    mapToModel(metadata, data, populate, cb) {
        const stopwatch = this.stopwatch(metadata.name + '.mapToModel');
        return this._manager.mapToModel(metadata, data, populate, function(err, data) {
            stopwatch && stopwatch.stop();
            cb(err, data);
        });
    }

    mapDataToModel(metadata, document, cb, walkRecursive) {
        const stopwatch = this.stopwatch(metadata.name + '.mapDataToModel');
        return this._manager.mapDataToModel(metadata, document, function(err, data) {
            stopwatch && stopwatch.stop();
            cb(err, data);
        }, function(err, mappedModel, idx) {
            stopwatch && idx > 0 && stopwatch.lap();
            if (typeof walkRecursive === 'function') {
                walkRecursive(err, mappedModel, idx);
            }
        });
    }

    mapDataToModels(metadata, document, cb, walk) {
        const stopwatch = this.stopwatch(metadata.name + '.mapDataToModels');
        return this._manager.mapDataToModels(metadata, document, function(err, data) {
            stopwatch && stopwatch.stop();
            cb(err, data);
        }, function(err, mappedModel, idx) {
            stopwatch && idx > 0 && stopwatch.lap();
            if (typeof walk === 'function') {
                walk(err, mappedModel, idx);
            }
        });
    }

    mapModelToData(metadata, model, cb) {
        const stopwatch = this.stopwatch(metadata.name + '.mapModelToData');
        return this._manager.mapModelToData(metadata, model, function(data) {
            stopwatch && stopwatch.stop();
            cb(data);
        });
    }

    updateBy(name, criteria, data) {
        return this.saveQuery(
            name,
            'updateBy',
            {name, criteria, data},
            this._manager.getRepository(name).updateBy(criteria, data)
        );
    }

    removeBy(name, criteria) {
        return this.saveQuery(
            name,
            'removeBy',
            {name, criteria},
            this._manager.removeBy(...arguments)
        );
    }

    flush(document) {
        const stopwatch = this.stopwatch('flush');
        return this.promise(
            this._manager.flush(...arguments),
            stopwatch
        );
    }

    find(name, id) {
        return this.saveQuery(
            name,
            'find',
            {name, criteria:{id}},
            this._manager.find(...arguments)
        );
    }

    findByQuery(name, query) {
        return this.saveQuery(
            name,
            'findByQuery',
            {name, query},
            this._manager.findByQuery(...arguments)
        );
    }

    findCountByQuery(name, query) {
        return this.saveQuery(
            name,
            'findCountByQuery',
            {name, query},
            this._manager.findCountByQuery(...arguments)
        );
    }

    findBy(name, criteria, sort, skip, limit) {
        return this.saveQuery(
            name,
            'findBy',
            {name, criteria, sort, skip, limit},
            this._manager.findBy(...arguments)
        );
    }

    findWhereIn(name, field, values, sort, limit) {
        return this.saveQuery(
            name,
            'findWhereIn',
            {name, field, values, sort, limit},
            this._manager.findWhereIn(...arguments)
        );
    }

    findCountBy(name, criteria) {
        return this.saveQuery(
            name,
            'findCountBy',
            {name, criteria},
            this._manager.findCountBy(...arguments)
        );
    }

    findOneBy(name, criteria, sort) {
        return this.saveQuery(
            name,
            'findOneBy',
            {name, criteria, sort},
            this._manager.findOneBy(...arguments)
        );
    }

    createSqlQuery(sql, params, repositoryName) {
        return this.saveQuery(
            repositoryName,
            'createSqlQuery',
            {sql, params, repositoryName},
            this._manager.createSqlQuery(...arguments)
        );
    }

    startTransaction() {
        return this.saveQuery(
            null,
            'startTransaction',
            null,
            this._manager.startTransaction(),
            'transaction.start'
        );
    }

    commitTransaction() {
        return this.saveQuery(
            null,
            'commitTransaction',
            null,
            this._manager.commitTransaction(),
            'transaction.commit'
        );
    }

    rollbackTransaction() {
        return this.saveQuery(
            null,
            'rollbackTransaction',
            null,
            this._manager.rollbackTransaction(),
            'transaction.rollback'
        );
    }

    connectWithConfig(config, cb) {
        const stopwatch = this.stopwatch('connection.open.config');
        return this.promise(
            this._manager.connectWithConfig(...arguments),
            stopwatch
        );
    }

    closeConnection(cb) {
        const stopwatch = this.stopwatch('connection.close');
        return this._manager.closeConnection(function(err) {
            stopwatch && stopwatch.stop();
            cb(err);
        });
    }
}

module.exports = ManagerRequestProxy;