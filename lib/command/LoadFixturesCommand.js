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

const AbstractCommand = require('@conga/framework').command.AbstractCommand;

const FixtureRegistry = require('../fixture/FixtureRegistry');

/**
 * This command will load fixture data from the fixtures directory into the
 * current database
 */
module.exports = class LoadFixturesCommand extends AbstractCommand {

    /**
     * The command
     *
     * @return {String}
     */
    static get command() {
        return 'bass:fixtures';
    }

    /**
     * The command description
     *
     * @return {String}
     */
    static get description() {
        return 'Load all of the fixtures into the database';
    }

    /**
     * Hash of command options
     *
     * @return {Object}
     */
    static get options() {
        return {
            //'foo' : ['-f, --foo [value]', 'some foo']
        };
    }

    /**
     * Array of command argument names
     *
     * @return {Array<String>}
     */
    static get arguments() {
        return [];
    }

    /**
     * Execute the command
     *
     * @param  {CommandInput}  input   the command input data
     * @param  {CommandOutput} output  the output writer
     * @param  {Function}      next    the next callback
     * @return {void}
     */
    execute(input, output, next) {

        this.output = output;

        output.writeln("Preparing to load fixtures...");

        const fixtures = this.loadFixtures();
        const calls = [];

        fixtures.forEach((fixture) => {

            calls.push((cb) => {
                output.writeln('loading fixture: ' + fixture.__FILE_PATH);
                fixture.load(cb);
            });

        });

        // doing timeout to allow bass dbs to connect
        // @todo - need to fix bass so that it doesn't boot until all connections have been made
        //         see bass -> compiler.js line #271
        setTimeout(() => {

            // run the events!
            this.container.get('async').series(calls, (err, results) =>{
                next();
            });

        }, 1000);

    }

    /**
     * Load all of the fixtures from app/bass/fixtures, initialize them, and order them
     *
     * @return {Array<AbstractFixture>}
     */
    loadFixtures() {

        const fixtures = [];
        const registry = new FixtureRegistry();

        const dir = path.join(this.container.getParameter('kernel.app_path'), 'bass', 'fixtures');

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
