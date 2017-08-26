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
const SessionRequestProxy = require('./SessionRequestProxy');

/**
 * Wrap the global Bass instance with a RequestProxy
 */
class BassRequestProxy extends RequestProxy {
    /**
     *
     * @param {Bass} bass The global bass instance
     * @param {Object} request The Conga request object
     * @param {Container} container The scoped service container
     */
    constructor(bass, request, container) {
        super(request, container);

        this._bass = bass;

        this.wrap(bass);
    }

    /**
     *
     * @returns {SessionRequestProxy}
     */
    createSession() {
        return new SessionRequestProxy(this._bass.createSession(), this._request, this._container);
    }
}

module.exports = BassRequestProxy;