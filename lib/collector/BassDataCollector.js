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
     * @returns {BassDataCollector}
     */
    saveQuery(adapter, name, data = {}) {
        this.getAdapter(adapter).queries.push({
            name,
            data,
            microtime: CongaProfiler.Stopwatch.StopwatchPeriod.microtime()
        });
        return this;
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
    getTemplate() {
        return '@conga/framework-bass:collector/bass.html.twig';
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
     * {@inheritDoc}
     */
    collectData(request, response, document = null) {
        // format the data for storage
        const queries = [];
        Object.keys(this.adapters).forEach(adapter => {
            let data = this.adapters[adapter];
            for (let query of data.queries) {
                let document = query.data.name;
                let queryData = Object.assign({}, query.data);
                delete queryData.name;

                let pretty = JSON.stringify(queryData, null, 2);
                let date = new Date();
                date.setTime(query.microtime / 1000);
                queries.push(Object.assign({adapter, date, pretty, document}, query, {data: queryData}));
            }
        });
        return Promise.resolve({ queries });
    }
};

module.exports = BassDataCollector || class { };