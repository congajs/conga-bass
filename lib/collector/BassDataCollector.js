/*
 * This file is part of the conga-bass library.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

let CongaProfiler;
try {
    // safely and quietly attempt to load the profiler module
    CongaProfiler = require('@conga/framework-profiler');
} catch(e) { }

/**
 * The BassDataCollector collects query information from bass during a request
 */
const BassDataCollector = CongaProfiler && class BassDataCollector
    extends CongaProfiler.Collector.DataCollectorInterface
{
    /**
     * Init this data collector with empty data object
     */
    constructor() {
        super();
        this.adapters = {};
    }

    /**
     * Get an adapter with saved data by name
     * @param {String} name The adapter name
     * @returns {Object}
     */
    getAdapter(name) {
        if (!(name in this.adapters)) {
            this.adapters[name] = {
                queries: []
            };
        }
        return this.adapters[name];
    }

    /**
     * Save query data
     * @param {String} adapter THe name of the bass adapter
     * @param {String} name The name / type of query (findBy, findOneBy, etc)
     * @param {Object|*} [data] The data sent up with the query (criteria, sort, etc.)
     * @returns {Object} The new saved data payload reference
     */
    saveQuery(adapter, name, data = {}) {
        const saved = {
            name,
            data,
            finished: 0,
            started: CongaProfiler && CongaProfiler.Stopwatch.StopwatchPeriod.microtime()
        };
        this.getAdapter(adapter).queries.push(saved);
        return saved;
    }

    /**
     * {@inheritDoc}
     */
    getName() {
        return 'Bass';
    }

    /**
     * {@inheritDoc}
     */
    hasDashboard() {
        return true;
    }

    /**
     * {@inheritDoc}
     */
    isEnabled() {
        return true;
    }

    /**
     * Escape object keys and data so they are safe to insert and legible to read
     * @param {Object} data
     * @returns {Object}
     */
    escapeData(data) {
        if (Array.isArray(data)) {
            return data.map(node => this.escapeData(node));
        }
        if (!(data instanceof Object) || data.constructor.name !== 'Object') {
            if (data && typeof data.toString === 'function') {
                return data.toString();
            }
            return data;
        }
        const escaped = {};
        for (const k in data) {
            const key = k.replace(/\$/g, '\uFF04').replace(/\./g, '\uFF0E');
            escaped[key] = this.escapeData(data[k]);
        }
        if (Object.keys(escaped).length === 0) {
            if (typeof data.toString === 'function') {
                escaped = data.toString();
            }
        }
        return escaped;
    }

    /**
     * {@inheritDoc}
     */
    collectData(request, response, document = null) {
        // format the data for storage
        const queries = [];
        Object.keys(this.adapters).forEach(adapter => {
            let data = this.adapters[adapter];
            for (let query of data.queries) {
                const queryData = this.escapeData(query.data);
                if (queryData.name) {
                    delete queryData.name;
                }

                const pretty = JSON.stringify(queryData, null, 2)
                    .replace(/\uFF04/g, '$')
                    .replace(/\uFF0E/g, '.');

                const date = new Date();
                date.setTime(query.started / 1000);

                const document = query.data.name;
                const processTime = query.finished - query.started;

                queries.push(Object.assign(
                    {adapter, date, processTime, pretty, document},
                    query,
                    {data: queryData}
                ));
            }
        });
        return Promise.resolve({ queries });
    }
};

module.exports = BassDataCollector || class { };