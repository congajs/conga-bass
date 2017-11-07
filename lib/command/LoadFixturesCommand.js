/*
 * This file is part of the conga-bass module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const path = require('path');

const AbstractCommand = require('@conga/framework').command.AbstractCommand;

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
            'bundle': ['-b, --bundle [value]', 'Load fixtures from a bundle']
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

        let fixturePath = path.join(
            this.container.getParameter('kernel.app_path'), 'bass', 'fixtures');

        if (input.hasOption('bundle')) {
            const bundle = input.getOption('bundle');
            if (this.container.getParameter('app.bundles').indexOf(bundle) === -1) {
                throw new TypeError('Bundle is not registered: ' + bundle);
            }
            fixturePath = this.container.get('namespace.resolver')
                .resolveWithSubpath(bundle + ':resources/bass/fixtures', 'lib');
        }

        this.container.get('bass.fixture.runner').runFixtures(
            fixturePath,
            (fixture) => {
                output.writeln('loading fixture: ' + fixture.__FILE_PATH);
            },
            next
        );

    }

}
