/**
 * A *naive* implementation of the native Promise API.
 *
 * @class
 */
class Oath {
	static get PENDING() {
		return 2 << 0;
	}

	static get RESOLVED() {
		return 2 << 1;
	}

	constructor(init) {
		const queue = this;

		/**
		 * The state of the queue: pending or resolved.
		 * @type {number}
		 */
		this._state = Oath.PENDING;
		/**
		 * The return value of a callback.
		 * @type {any}
		 */
		this._data = null;
		/**
		 * The next Oath in the queue.
		 * @type {Oath}
		 */
		this._next = null;
		/**
		 * The previous Oath in the queue. This is to handle errors thrown
		 * by Oaths returned from callbacks.
		 * @type {Oath}
		 */
		this._prev = null;
		/**
		 * The error callback.
		 * @type {function}
		 */
		this._error = null;
		/**
		 * The function callback for the Oath.
		 * @type number
		 */
		this._cb = init || null;

		// A delay of 0ms is used to simulate async execution
		init && setTimeout(() => queue.isPending() && init(resolve, reject), 0);

		function resolve(data) {
			queue._callNext(data);
		}

		function reject(err) {
			queue._fail(err, true);
		}
	}

	/**
	 * @desc Changes the internal state of the Oath
	 * @param {number} state - The state
	 * @param {any} data - The return value
	 * @protected
	 */
	_changeState(state, data) {
		this._state = state;
		this._data = data;
	}

	/**
	 * @desc Executes the next item in the queue
	 * @param {any} data - The return value
	 * @protected
	 */
	_callNext(data) {
		const queue = this;

		let isOath = data != null && data instanceof Oath;

		// Resolve this item
		this._changeState(Oath.RESOLVED, data);

		if (isOath) {
			// Perform hack
			if (!data._getClosestErrorHandler())
				data._prev = this;
			data._next = this._next;
			this._next = data;
		}

		let next = this._next;

		execProceed();

		function execProceed() {
			if (next) {
				if (isOath) {
					// Do nothing: since the hack has been done above
					// the Oath will call its proceed() itself in call to
					// _callNext()
				} else {
					proceed(data);
				}
			}
		}

		function proceed(data) {
			let result;
			try {
				result = typeof next._cb ? next._cb(data) : null;
			} catch (error) {
				// throw next._cb.toString();
				queue._fail(error);
			}
			next._callNext(result);

			// GC
			next = null;
		}
	}

	/**
	 * @desc Executes the closest error callback down the queue
	 * @param {Error} err - The error object
	 * @param {boolean} fromPrev - Should the traversal start from the previous
	 * item?
	 * @protected
	 */
	_fail(err, fromPrev) {
		const errCb = (fromPrev ? (this._prev || this) : this)._getClosestErrorHandler();

		this._changeState(Oath.RESOLVED, null);

		if (!errCb) {
			const stack = new Error().stack;
			console.error(`Unhandled rejection warning! ${(err ? err.message : '')} \n${stack}`);
		} else {
			errCb(err);
		}
	}

	/**
	 * @desc Gets the closest error handler down the queue
	 * @returns {function} [errorCb=null]
	 * @protected
	 */
	_getClosestErrorHandler() {
		// Find the closest error handler
		let cursor = this;
		while (cursor && !cursor._error) {
			cursor = cursor._next;
		}

		return cursor ? cursor._error : null;
	}

	/**
	 * @desc Adds the a new Oath to the queue
	 * @param {function} callback - The callback function
	 * @protected
	 */
	then(callback) {
		if (typeof callback !== 'function') {
			throw 'Argument passed to Oath#then must be a function';
		}

		const q = new Oath();
		q._cb = callback;
		q._prev = this;

		// ensure pending state
		q._changeState(Oath.PENDING, null);

		this._next = q;

		if (!this.isPending()) {
			this._callNext(this._data);
		}

		return q;
	}

	/**
	 * @desc Registers an error callback
	 * @param {function} callback - The error callback
	 * @protected
	 */
	catch(callback) {
		this._error = callback;

		return this;
	}

	/**
	 * @desc Is this item in a pending state?
	 * @param {function} callback - The callback function
	 * @protected
	 */
	isPending() {
		return this._state === Oath.PENDING;
	}

	static resolve(data) {
		const q = new Oath((res, rej) => res(data));
		return q;
	}

	static reject(err) {
		const q = new Oath((res, rej) => rej(err));
		return q;
	}

	static all(oaths) {
		let comb = Oath.resolve();
		const retValues = [];

		return oaths.reduce((comb, o) => {
			return comb.then(() => o);
		}, Promise.resolve());
	}
}



Oath.all([Oath.resolve(10)])
	.then(data => console.log(data))