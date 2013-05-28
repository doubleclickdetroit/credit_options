/*
 * Logger
 *
 * @access: public
 * @return: void
*/
window.log = function() {
	log.history = log.history || [];
	log.history.push(arguments);

	if (this.console)
		console.log( Array.prototype.slice.call(arguments) );
};

window.log.prototype = window.log.debug = function() {
	if (window['WEX'] === undefined || (WEX && WEX.debug) )
		log.apply(window, arguments);
};

(function(doc) {
	var write = doc.write;
	doc.write = function(q) {
		log('document.write(): ',arguments);
		if (/docwriteregexwhitelist/.test(q)) write.apply(doc,arguments);
	};
})(document);


/*
 * jQuery Keys Plug-in
 *
 * @author: Ben Babics
 * @access: public
 * @param : object
 * @useage: $.keys({ foo:"foo", bar:"bar", baz:"baz"})
 * @return: array ['foo', 'bar', 'baz']
*/
$.extend({
	keys : Object.keys || function(o) {
		if (o !== Object(o))
			throw new TypeError('Object.keys called on non-object');
		var p, ret=[], hop=Object.prototype.hasOwnProperty;
		for(p in o) if(hop.call(o,p)) ret[ret.length] = p;
		return ret;
	}
});


/*
 * Extending classes
 * [http://gist.github.com/1596267]
 *
 * @author : Ben Babics
 * @access : public
 * @param  : function (subClass)
 * @param  : function (superClass)
 * @return : void
*/
WEX.method.extend = function(subClass, superClass) {
	var F = function() {};

	F.prototype = superClass.prototype;
	subClass.prototype = new F();
	subClass.prototype.constructor = subClass;

	subClass.superClass = superClass.prototype;
	if (superClass.prototype.constructor == Object.prototype.constructor)
		superClass.prototype.constructor = superClass;
};


/*
 * Observer
 * @author: Ben Babics
*/
;(function() {

	var Observer = function() {
		this.subscribers = [];
	};
	Observer.prototype = {
		constructor: Observer,
		subscribe: function(fn) {
			this.subscribers.push(fn);
			return this;
		},
		notify: function() {
			for (var i=0; i < this.subscribers.length; i++) {
				var fn = this.subscribers[i];
				if (typeof fn === 'function') fn.apply(null, arguments);
			}
			return this;
		}
	};

	/*
	 * Observer Instance
	 *
	 * @access: public
	 * @return: constructor
	*/
	WEX.method.Observer = function() {
		return new Observer;
	};
})();


/*
 * Custom Events
 * @author: Ben Babics
*/
;(function() {

	var CustomEvent = function(name) {
		CustomEvent.superClass.constructor.call(this);
		this.name = name;
	};

	// Custom Events extends Observer
	WEX.extend(CustomEvent, WEX.Observer().constructor);

	// Custom Events [convenience methods]
	var events = {};
	function bind(name, fn) {
		if (name && typeof name === 'string') {
			if (events[name] == null)
				events[name] = new CustomEvent(name);
			if (fn != null)
				events[name].subscribe(fn);
		}
		return WEX;
	}
	function trigger(name) {
		if (name && typeof name === 'string')
			if (events[name] != null && typeof events[name].notify === 'function') {
				log.debug( 'WEX Event Triggered', name, [].slice.call(arguments, 1) );
				events[name].notify.apply(events[name], arguments);
			}
		return WEX;
	}

	/*
	 * Bind Custom Event
	 *
	 * @access: public
	 * @param : string, e.g. "form:submit"
	 * @param : function (callback)
	 * @return: WEX
	*/
	WEX.method.bind = bind;

	/*
	 * Trigger Custom Event
	 *
	 * @access: public
	 * @param : string, e.g. "form:submit"
	 * @param : object litteral, e.g. {foo:"bar"}
	 * @return: WEX
	*/
	WEX.method.trigger = trigger;

})();


/*
 * Show/Hide/Toggle UI Loader
 *
 * @author: Ben Babics
*/
(function() {
	WEX.method.showLoader   = function(text) { WEX.trigger('show-loader', text);   };
	WEX.method.hideLoader   = function() { WEX.trigger('hide-loader');             };
	WEX.method.toggleLoader = function(text) { WEX.trigger('toggle-loader', text); };
})();


/*
 * Script Loader plugin
 *
 * @author: Ben Babics
 * @note  : see getter/setter syntax below
*/
(function() {

	var _plugin    = {},
	    _required  = {},
	    _prefixJS  = "static/js/libs/",
	    _prefixCSS = "static/css/libs/";


	/* Define Plug-ins and their path */
	_plugin['alphanumeric']    = [_prefixJS+"jquery.alphanumeric.min.js"];
	_plugin['masking']         = [_prefixJS+"jquery.maskedinput-1.3.min.js"];
	_plugin['template']        = [_prefixJS+"jquery.tmpl.min.js"];
	_plugin['datepicker']      = [_prefixJS+"jquery-ui-1.9.2.custom.min.js", _prefixCSS+"jquery-ui/jquery-ui-1.9.2.custom.min.css"];
	// _plugin['format_currency'] = _prefix+"formatCurrency.js";
	// _plugin['datatable']       = _prefix+"jquery.dataTables.min.js";
	// _plugin['knockout']        = _prefix+"knockout-1.2.1.js";


	/* Define convenience methods WEX Plug-ins will use */
	function fetch_resources(path, fn) {
		log.debug('**** fn.required() PLUGIN BEGIN:', name);
		yepnope({
			load    : path,
			callback: report_resource_loaded,
			complete: fn || null
		});
	}
	function report_resource_loaded(resource) {
		var path = resource.split('/');
		resource = path[path.length -1];
		log.debug('fn.require() LOADING:', resource);
	}
	function require(name, fn) {
		if (!ensureRequire(name, fn)) return;

		_required[name] = false;

		fetch_resources(_plugin[name], function() {
			log.debug('fn.require() PLUGIN COMPLETED:', name);
			WEX.trigger('require-'+name);
			if (fn && $.isFunction(fn)) fn();
			_required[name] = true;
		});
	}
	function ensureRequire(name, fn) {
		// plug-in is in the process of loading, bind callback for when complete
		if (_required[name] == false)
			WEX.bind('require-'+name, fn);

		// plug-in has already instantiated, trigger callback now
		else if (_required[name] == true) {
			log.debug('**** fn.required() Plug-in already initialized:', name);
			if (fn && $.isFunction(fn)) fn();
		}

		// plug-in requested does not exist
		else if (_plugin[name] == null)
			log.debug('**** fn.required() Cannot find plug-in:', name);

		// plug-in requested has not been requested yet, request now
		else
			return true;

		// plug-in requested should not be requested again
		return false;
	}


	/*
	 * Require Script(s) and bind callback method
	 * @author: Ben Babics
	 * @param : String or Array
	 * @param : Callback Function
	*/
	WEX.fn.require = function(fn) {
		var name = this;

		function getRequired(name, fn) {
			if ($.isArray(name)) {
				var cb    = fn,
				    names = name;

				// pop the first off the stack
				name = names.shift();

				// recurse through the stack
				fn = (names.length) ? function() { getRequired(names, cb); } : cb;
			}

			// require the item popped-off the stack
			require(name, fn);
		}

		/*
		 * Setter method
		 *
		 * @note  : require script(s) and fire callback when loaded
		 * @syntax: WEX('script-a').require(fn)
		 * @syntax: WEX(['script-a', 'script-b', 'script-c']).require(fn)
		 * @return: self
		*/
		if (arguments.length >= 1) {
			if (name != undefined || name != '')
				getRequired(name, fn);
		}

		/*
		 * Getter method
		 *
		 * @note  : get all script name/value pairs
		 * @syntax: WEX().require();
		 * @syntax: WEX.fn.require();
		 * @return: object-literal of all scripts required
		*/
		else
			return $.extend({}, _plugin);

		return this;
	};
})();


/*
 * Extend Masking
 *
 * @author: Ben Babics
*/
(function() {
	WEX.bind('require-masking', function() {
		$.extend($.mask.definitions, {
			"~": "[+-]",
			"m": "[01]",
			"d": "[0-3]"
		});
	});
})();


/*
 * Build object literal from query string
 * [http://bit.ly/gWliW5]
 *
 * @access: public
 * @str   : string ("?fname=john&lname=doe")
 * @return: object ({ fname: "john", lname: "doe" })
*/
WEX.method.objectify = function() {
    var e,
        p = {},
        a = /\+/g,
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent( s.replace(a,' ') ) };

    function objectify(str) {
        if (!str || str.indexOf('?') < 0) return {};
        else str = str.split('?')[1];
        while (e = r.exec(str)) p[d(e[1])] = d(e[2]);
        return p;
    }

    return objectify;
}();


/*
 * Extend AJAX
 *
 * @author: Ben Babics
*/
(function() {
	var AJAX = $.ajax;

	function get_context(conf) {
		var ctx = conf['context'];
		return ctx ? ctx['jquery'] ? ctx : $(ctx) : false;
	}

	$.ajax = function() {
		var deferred, $context;

		// define context
		$.each(arguments, function(n, arg) {
			if ( $.isPlainObject(arg) )
				$context = get_context(arg);
		});

		// set AJAX request as deferred
		deferred = AJAX.apply(this, arguments);

		// add class and remove class when deferred is complete
		if ($context) {
			$context.addClass('ui-loader');
			deferred.done(function() {
				setTimeout(function() {
					$context.removeClass('ui-loader');
				}, 500); // short timeout
			});
		}

		// return deferred
		return deferred;
	};
})();