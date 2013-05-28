(function(window, undefined) {

var _hasLoaded, _readyCallbackStack, WEX;

	_hasLoaded = false;
	_readyCallbackStack = [];

	function applicationIsReady() {
		_hasLoaded = true;

		log.debug('Application is ready. Notifying page subscribers.');

		if (_readyCallbackStack.length) {
			do _readyCallbackStack.shift()();
			while (_readyCallbackStack.length)
		}
	}

	function WEXify() {
		var len      = arguments.length,
			arg      = arguments[0],
			is_array = typeof arg == 'object' && (arg instanceof Array),

			// Make array of args, use array if arg[0] typeof Array, or create blank array if no args
			arr = len > 0 ? len < 2 && is_array ? arg : [].slice.call(arguments, 0) : [];

		// Augment with WEX.fn methods
		for (name in WEX.fn) arr[name] = WEX.fn[name];

		return arr;
	}

	// Define a local copy of WEX
	WEX = function(selector) {
		return new WEX.method.fn.init(selector);
	};

	// Set debug default
	WEX.debug = false;

	// Ability to add static methods to WEX function
	WEX.method = WEX;

	// Ability to add plug-ins to WEX.prototype
	WEX.method.fn = WEX.prototype = {
		constructor: WEX,
		init: function() {
			var s = arguments[0],
				t = typeof s;

			if ( /^(string|object)$/.test(t) )
				return WEXify(s);

			// Binds a function to be executed when core scripts have finished loading.
			if (/^(function)$/.test(t) ) {
				_readyCallbackStack.push(s);
				if (_hasLoaded) applicationIsReady();
			}

			return WEXify();
		}
	};

	// Give the init function the WEX prototype for later instantiation
	WEX.method.fn.init.prototype = WEX.method.fn;

	// Assign WEX to global scope
	window.WEX = WEX;

	// Async load core scripts
	yepnope([
		"js/vendor/jquery-1.8.0.min.js",
		"js/vendor/bootstrap.min.js",
		"js/components.js",
		"js/plugins.js",
		"js/main.js",

		"js/shims/selectivizr-min.js",

		// notify WEX all scripts have loaded
		{
			complete: function() {
				log.debug('---- App Logs -----------------------');
				log.debug('Successfully loaded all core scripts.');
				WEX.trigger('appinit');
				applicationIsReady();
			}
		}
	]);
})(this);