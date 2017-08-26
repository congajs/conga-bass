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
const ManagerFactoryRequestProxy = require('./ManagerFactoryRequestProxy');

/**
 * Wrap the Bass Session with a RequestProxy
 */
class SessionRequestProxy extends RequestProxy {
    /**
     *
     * @param {Session} session The underlying bass session instance
     * @param {Object} request The Conga request object
     * @param {Container} container The scoped service container
     */
    constructor(session, request, container) {
        super(request, container);

        // use our manager factory to pass the request and container to each manager
        this.managerFactory = new ManagerFactoryRequestProxy(session.managerFactory, request, container);

        // NOTE: this creates a new session (even if previously closed)
        this.managers = {};

        // wrap the session
        this.wrap(session);
    }
}

module.exports = SessionRequestProxy;