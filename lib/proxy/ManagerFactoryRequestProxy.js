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
const ManagerRequestProxy = require('./ManagerRequestProxy');

/**
 * Wrap the Bass ManagerFactory with a RequestProxy
 */
class ManagerFactoryRequestProxy extends RequestProxy {
    /**
     *
     * @param {ManagerFactory} managerFactory The underlying bass manager-factory
     * @param {Object} request The Conga request object
     * @param {Container} container The scoped service container
     */
    constructor(managerFactory, request, container) {
        super(request, container);

        this._managerFactory = managerFactory;

        this.wrap(managerFactory);
    }

    /**
     * Create a new Manager from a manager definition
     *
     * @param  {String}   name
     * @param  {Session}  session
     * @return {ManagerRequestProxy|Manager}
     */
    factory(name, session) {
        return new ManagerRequestProxy(
            this._managerFactory.factory(...arguments),
            this._request,
            this._container
        );
    }
}

module.exports = ManagerFactoryRequestProxy;