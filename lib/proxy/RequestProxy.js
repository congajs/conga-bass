/*
 * This file is part of the conga-bass library.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The request proxy wraps another instance and holds on to the request and scoped container
 */
class RequestProxy {
    /**
     *
     * @param {Object} request The conga request object
     * @param {Container} container The (scoped) service container
     */
    constructor(request, container) {
        this._request = request;
        this._container = container;
    }

    /**
     * Wrap this object around another object
     * @param {Object} obj
     */
    wrap(obj) {
        if (!obj || !(obj instanceof Object)) {
            return;
        }
        Object.keys(obj).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(obj))).forEach(property => {
            if (this[property] === undefined) {
                this.__defineGetter__(property, () => obj[property]);
            }
        });
    }
}

module.exports = RequestProxy;