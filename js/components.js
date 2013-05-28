;(function() {

var View, Region;

/*
 * View
 *
 * @author: Ben Babics
 * @access: private
 * @param : [optional] element or jQuery Element(s)
 * @return: View
*/
View = (function() {

	function View(el) {
		el = el && (el instanceof Element || el.jquery) ? el : $('<div/>');
		this.el  = el.jquery ? el.get(0) : el;
		this.$el = $(this.el);
		this.initialize();
	}

	View.prototype = {
		initialize: function() {},
		onOpen    : function()  { this.render('show'); },
		onClose   : function()  { this.render('hide'); },
		onDestroy : function()  { this.$el.remove();   },
		render    : function(d) {
			d = d == 'show' ? d : d == 'hide' ? d : d;
			this.$el[d]();
		}
	};

	return View;
})();


/*
 * Region
 *
 * @author: Ben Babics
 * @access: private
 * @param : string (id of Region)
 * @param : [optional] element or jQuery Element(s) or View
 * @return: Region
*/
Region = (function() {

	var close, find, open;

	find = function(items, id) {
		return $.map(items, function(obj) {
			if (obj.id == id) return obj;
		})[0] || this;
	};

	open = function(id) {
		var children;
		if (this.view != null)
			this.view.onOpen();

		children = id != null ? [this.find(id)] : this.children;
		return $.each(children, function(n, child) {
			return child.open();
		});
	};

	close = function(id) {
		var children, _ref;
		if (this.view != null)
			this.view.onClose();

		children = id != null ? [this.find(id)] : this.children;
		return $.each(children, function(n, child) {
			return child.close();
		});
	};

	function Region(id, view) {
		if (view == null || view instanceof View == false)
			view = new View(view);

		this.id   = id;
		this.view = view;
		this.el   = view.el;
		this.$el  = view.$el;
		this.children = [];
	}

	Region.prototype.addTo = function(parent) {
		if (parent instanceof Region) {
			parent.add(this);
		}
		return this;
	};

	Region.prototype.add = function(child) {
		this.children.push(child);
		this.$el.append(child.$el);
		return this;
	};

	Region.prototype.remove = function(id) {
		var child, _ref, _ref1, _ref2;
		child = this.find(id);
		if (((_ref = this.children) != null ? _ref.indexOf(child) : void 0) >= 0) {
			if ((_ref1 = this.children) != null) {
				_ref1.splice(this.children.indexOf(child), 1);
			}
			child.removeAll();
			if ((_ref2 = child.view) != null) {
				_ref2.onDestroy();
			}
		}
		return this;
	};

	Region.prototype.removeAll = function() {
		var _results;
		_results = [];
		while (this.children.length) {
			_results.push(this.remove(this.children[0]));
		}
		return _results;
	};

	Region.prototype.find = function(id) {
		if (typeof id === 'string')
			return find.call(this, this.children, id);
		return id;
	};

	Region.prototype.all = function() {
		var methods;
		methods = {
			all: this.all,
			open: this.open,
			close: this.close,
			except: this.except,
			_children: this.children || this._children
		};
		return $.extend([], this.children || this._children, methods);
	};

	Region.prototype.except = function(id) {
		var index, selection;
		selection = $.isArray(this) ? this : [this];
		if ((id != null) && typeof id === 'string') {
			index = $.inArray( find(selection, id), selection);
			if (index >= 0) selection.splice(index, 1);
		}
		return selection;
	};

	Region.prototype.open = function(id) {
		var selection;
		selection = $.isArray(this) ? this : [this];
		$.each(selection, function(n, region) {
			return open.call(region, id);
		});
		return this;
	};

	Region.prototype.close = function(id) {
		var selection;
		selection = $.isArray(this) ? this : [this];
		$.each(selection, function(n, region) {
			return close.call(region, id);
		});
		return this;
	};

	return Region;

})();

window.View = View;
window.Region = Region;

})();