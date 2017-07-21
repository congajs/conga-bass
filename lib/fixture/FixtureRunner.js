/*
 * This file is part of the conga-bass module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const fs = require('fs');
const glob = require('glob');
const path = require('path');

const FixtureRegistry = require('../fixture/FixtureRegistry');

/**
 * The FixtureRunner provides methods to run bass fixtures
 */
module.exports = class FixtureRunner {

    /**
     * Construct with a container
     * @param  {Container} container
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Run fixtures from the given directory
     *
     * @param  {String}     dir       full path to fixture directory
     * @param  {Function}   onRunEach function to call before each fixture is run
     * @param  {Function}   next      function
     * @return {void}
     */
    runFixtures(dir, onRunEach, next) {

        const fixtures = this.loadFixtures(dir);
        const calls = [];

        fixtures.forEach((fixture) => {

            calls.push((cb) => {

                if (typeof onRunEach === 'function') {
                    onRunEach(fixture);
                }

                fixture.load(cb);
            });

        });

        this.container.get('async').series(calls, (err, results) =>{
            next();
        });

    }

    /**
     * Load all of the fixtures from app/bass/fixtures, initialize them, and order them
     *
     * @return {Array<AbstractFixture>}
     */
    loadFixtures(dir) {

        const fixtures = [];
        const registry = new FixtureRegistry();

        if (!fs.existsSync(dir)) {
            this.output.writeln("ERROR: Fixtures directory (" + dir + ") doesn't exist!");
            process.exit();
        }

        const files = glob.sync(path.join(dir, '*Fixture.js'));

        files.forEach((file) => {

            const Fixture = require(file);
            const fixture = new Fixture(this.container, registry);

            fixture.__FILE_PATH = file;

            fixtures.push(fixture);
        });

        fixtures.sort((a, b) => {
            if (a.getOrder() < b.getOrder())
                return -1;
            if (a.getOrder() > b.getOrder())
                return 1;
            return 0;
        });

        return fixtures;
    }
}
