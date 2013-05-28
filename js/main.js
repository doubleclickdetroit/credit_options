/*******************************************************************************
**** Module Auto-Initialization
*******************************************************************************/
;(function() {

	// stored modules
	var modules = {};

	// private methods used by auto-initialization code below
	function add_module(module) {
		WEX.bind('appinit', module.trigger);
	}
	function delegate_events(evt, data) {
		if (modules[evt][data.type]['respond'] != null)
			modules[evt][data.type]['respond'].call(data);
	}


	/***************************************************************************
	**** Module Definitions
	***************************************************************************/
	//
	// Twitter Bootstrap
	//
	modules.bootstrap = {
		popover: function() {
			$('[rel=popover]').popover();
		},
		tooltip: function() {
			$('[rel=tooltip]').tooltip();
		}
	};

	//
	// UI
	//
	modules.ui = {
		"show-loader": {
			trigger: function() {
				WEX.bind('show-loader', function(evt, text) {
					WEX.trigger('ui', { type:'show-loader', context:$('[data-module=loader]'), msg:text });
				});
			},
			respond: function() {
				this.context.addClass('ui-loader');
				if (this.msg) this.context.text(this.msg);
			}
		},
		"hide-loader": {
			trigger: function() {
				WEX.bind('hide-loader', function() {
					WEX.trigger('ui', { type:'hide-loader', context:$('[data-module=loader]') });
				});
			},
			respond: function() {
				this.context.removeClass('ui-loader').text('');
			}
		},
		"toggle-loader": {
			trigger: function() {
				WEX.bind('toggle-loader', function(evt, text) {
					WEX.trigger('ui', { type:'toggle-loader', context:$('[data-module=loader]'), msg:text });
				});
			},
			respond: function() {
				var is_loading = this.context.hasClass('ui-loader');
				WEX[(is_loading ? 'hide' : 'show') + 'Loader'](this.msg);
			}
		}
	};

	//
	// Forms
	//
	modules.forms = {
		"error-handling": {
			trigger: function() {
				var $controls = $('.text-error').parents('.control-group');
				if ($controls.length)
					WEX.trigger('forms', { type:'error-handling', context:$controls });
			},
			respond: function() {
				this.context.addClass('error');
			}
		},
		"inline-radio-input": function() {
			function handleRadioButtonSelection() {
				var $input = $(this).parent().find(':text, select');
				if ($input.length) $input.focus();
			}

			$(document.body)
				.delegate(':radio','focus', handleRadioButtonSelection)
				.find(':radio:checked').each(function() {
					handleRadioButtonSelection.call(this);
				});
		},
		"char-formatting": {
			trigger: function() {
				var ATTRS, fields = {},
				ATTRS  = "mask alpha numeric alphanumeric".split(' ');

				$.each(ATTRS, function(n, attr) {
					$fields = $('[data-'+attr+']');
					if ($fields.length) {
						WEX.trigger("forms", {
							method : attr,
							context: $fields,
							type   : "char-formatting"
						});
					}
				});
			},
			respond: function() {
				function require(method, $fields) {
					var lib;

					if ( "mask".match(method) )
						lib = "masking";
					if ( "alpha numeric alphanumeric".match(method) )
						lib = "alphanumeric";

					WEX(lib).require(function() {
						delegate(method, $fields);
					});
				}

				function extend(method, option) {
					switch(method) {
						case "mask":
							return (option || "aaaa").toString();
						break;

						case "numeric":
							option = "~&_+`-{}|':,./".match(option) ? option : "";
							return {allow: option || ""}
						break;

						case "alpha":
						case "alphanumeric":
							return {allow: option || "~&_+`-{}|':,./"};
						break;
					}
				}

				function delegate(method, $fields) {
					$fields.each(function() {
						var $field = $(this),
							option = $field.data(method); // enhance by removing method arg
						$field[method](extend(method, option));
					});
				}

				return function() {
					if (this.context.length == 0) return;
					require(this.method, this.context);
				}
			}()
		},
		"datepicker": function() {
			var _defaultHasBeenSet, FIELDS, CONF;

			_defaultHasBeenSet = false;

			FIELDS = "input[data-date]";

			CONF = {
				showOn          : "both",
				buttonImage     : "static/img/ui-calendar.gif",
				buttonImageOnly : true,
				buttonText      : "Choose Date",
				dateFormat      : "mm/dd/yy",
				showAnim        : "slideDown"
			};

			function pre_trigger() {
				var $fields = $(FIELDS);

				if ($fields.length) {

					// lazy-load datepicker plug-in
					WEX('datepicker').require(function() {

						// set datepicker defaults, if needed
						setDatepickerDefaults();

						// init datepicker plug-in on fields
						trigger.call($fields);
					});
				}
			}

			function setDatepickerDefaults() {
				if (!_defaultHasBeenSet) {
					// set config object for all date-fields
					$.datepicker.setDefaults(CONF);

					_defaultHasBeenSet = true;
				}
			}

			function trigger() {
				WEX.trigger('forms', { type:'datepicker', context:this });
			}

			function respond() {
				// make each field a date-field
				this.context.each(function() {
					var $e = $(this);
					$e.datepicker({
						minDate : $e.attr('mindate') || null,
						maxDate : $e.attr('maxdate') || null
					});
				});
			}

			return {
				trigger: pre_trigger,
				respond: respond
			};
		}()
	};

	//
	// Layout
	//
	modules.layout = {
		"mega-menu": {
			trigger: function() {
				function give_menu_layout() {
					var give_layout, $dropdowns;

					// don't give_layout if menu is collapsed
					give_layout= $('#nav-collapse-btn').is(':hidden');

					// find dropdown menus
					$dropdowns = $('.ui-navigation .dropdown-menu');

					// trigger 'mega-menu' for each dropdown
					$dropdowns.each(function() {
						WEX.trigger('layout', {
							type         : "mega-menu",
							context      : $(this),
							"give_layout": give_layout
						});
					});
				}

				give_menu_layout();
				$(window).resize( give_menu_layout );
			},
			respond: function() {
				var offset = scope = 0,
					$dropdown = this.context,
					$menus = $dropdown.find('ul');

				// exit if not mega menu
				if ( $menus.length < 2 ) return false;

				// reset width of mega-menu
				$dropdown.css( 'width', 'auto' );

				// reset width of mega-menu
				$menus.css( 'height', 'auto' );

				// now that it's reset, don't give any further layout
				if ( !this.give_layout ) return false;

				// value to represent offset from window
				offset = $dropdown.offset().left;

				// determine width of mega-menu
				$menus.each(function() {
					var $e = $(this),
						menu_width = $e.outerWidth(),
						is_within_bounds = offset > 0;

					// determine the width
					if (is_within_bounds) {
						offset -= menu_width;
						scope += menu_width;
					}
				});

				// assign width to mega-menu
				$dropdown.css( 'width', scope );

				// reset values to reuse
				offset = scope = 0;

				// determine if necessary to show border
				$menus.each(function() {
					var $e = $(this),
						new_offset = $e.offset().top,
						new_height = $e.outerHeight();

					// compare and assign the tallest height
					if ( scope < new_height ) {
						scope = new_height;
					}

					// add/remove 'style-no-border' class appropriately
					// if this is the first element with a new offset hieght
					$e.toggleClass( 'style-no-border', new_offset != offset );
					offset = new_offset; // assign the offset height
				});

				// assign height to mega-menu
				$menus.css( 'height', scope );
			}
		},
		fullscreen: {
			trigger: function() {
				$('[data-fullscreen]').on('click', function(evt) {
					evt.preventDefault();
					console.log('fullscreen trigger', this);
					WEX.trigger('layout', { type:'fullscreen', context:this });
				});
			},
			respond: function() {
				var $containers;

				return function() {
					console.log('fullscreen respond');
					$containers = $containers || $('.container');
					log.debug('fullscreen containers', $containers);
					$containers
						.toggleClass('container')
						.toggleClass('container-fluid');

					$('i', this.context)
						.toggleClass('icon-resize-full')
						.toggleClass('icon-resize-small');
				}
			}()
		}
	};


	/***************************************************************************
	**** Auto-Initialize Modules
	***************************************************************************/
	$.each(modules, function(id) {
		WEX.bind(id, delegate_events);

		$.each(modules[id], function(name, module) {
			if ( $.isFunction(module) ) module();

			else if ( $.isPlainObject(module) ) {
				if (module.trigger && module.respond)
					add_module(module);
				else
					log.debug('ERROR [main.js]:', 'Module \''+name+'\'', 'missing required properties.');
			}
		});
	});

})();