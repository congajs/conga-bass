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
        this._collector.saveQuery(this.getAdapterName(), 'updateBy', {name, criteria, data});
        const stopwatch = this.stopwatch(name + '.updateBy');
        return this.promise(
            this._manager.getRepository(name).updateBy(criteria, data),
            stopwatch
        );
    }

    removeBy(name, criteria) {
        this._collector.saveQuery(this.getAdapterName(), 'removeBy', {name, criteria});
        const stopwatch = this.stopwatch(name + '.removeBy');
        return this.promise(
            this._manager.removeBy(...arguments),
            stopwatch
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
        this._collector.saveQuery(this.getAdapterName(), 'find', {name, criteria: {id}});
        const stopwatch = this.stopwatch(name + '.find');
        return this.promise(
            this._manager.find(...arguments),
            stopwatch
        );
    }

    findByQuery(name, query) {
        this._collector.saveQuery(this.getAdapterName(), 'findByQuery', {name, query});
        const stopwatch = this.stopwatch(name + '.findByQuery');
        return this.promise(
            this._manager.findByQuery(...arguments),
            stopwatch
        );
    }

    findCountByQuery(name, query) {
        this._collector.saveQuery(this.getAdapterName(), 'findCountByQuery', {name, query});
        const stopwatch = this.stopwatch(name + '.findCountByQuery');
        return this.promise(
            this._manager.findCountByQuery(...arguments),
            stopwatch
        );
    }

    findBy(name, criteria, sort, skip, limit) {
        this._collector.saveQuery(this.getAdapterName(), 'findBy', {name, criteria, sort, skip, limit});
        const stopwatch = this.stopwatch(name + '.findBy');
        return this.promise(
            this._manager.findBy(...arguments),
            stopwatch
        )
    }

    findWhereIn(name, field, values, sort, limit) {
        this._collector.saveQuery(this.getAdapterName(), 'findWhereIn', {name, field, values, sort, limit});
        const stopwatch = this.stopwatch(name + '.findWhereIn');
        return this.promise(
            this._manager.findWhereIn(...arguments),
            stopwatch
        );
    }

    findCountBy(name, criteria) {
        this._collector.saveQuery(this.getAdapterName(), 'findCountBy', {name, criteria});
        const stopwatch = this.stopwatch(name + '.findCountBy');
        return this.promise(
            this._manager.findCountBy(...arguments),
            stopwatch
        );
    }

    findOneBy(name, criteria, sort) {
        this._collector.saveQuery(this.getAdapterName(), 'findOneBy', {name, criteria, sort});
        const stopwatch = this.stopwatch(name + '.findOneBy');
        return this.promise(
            this._manager.findOneBy(...arguments),
            stopwatch
        );
    }

    createSqlQuery(sql, params, repositoryName) {
        this._collector.saveQuery(this.getAdapterName(), 'createSqlQuery', {sql, params, repositoryName});
        const stopwatch = this.stopwatch((repositoryName && repositoryName + '.') + 'createSqlQuery');
        return this.promise(
            this._manager.createSqlQuery(...arguments),
            stopwatch
        );
    }

    startTransaction() {
        this._collector.saveQuery(this.getAdapterName(), 'startTransaction');
        const stopwatch = this.stopwatch('transaction.start');
        return this.promise(
            this._manager.startTransaction(),
            stopwatch
        );
    }

    commitTransaction() {
        this._collector.saveQuery(this.getAdapterName(), 'commitTransaction');
        const stopwatch = this.stopwatch('transaction.commit');
        return this.promise(
            this._manager.commitTransaction(),
            stopwatch
        );
    }

    rollbackTransaction() {
        this._collector.saveQuery(this.getAdapterName(), 'rollbackTransaction');
        const stopwatch = this.stopwatch('transaction.rollback');
        return this.promise(
            this._manager.rollbackTransaction(),
            stopwatch
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