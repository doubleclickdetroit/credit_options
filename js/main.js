(function() {
  var Module;

  Module = (function() {
    var responder;

    responder = null;

    function Module(name) {
      if (name != null) WEX.bind(name, this.exec);
    }

    Module.prototype.trigger = function(fn) {
      if ($.isFunction(fn)) fn();
      return this;
    };

    Module.prototype.respond = function(fn) {
      if ($.isFunction(fn)) responder = fn;
      return this;
    };

    Module.prototype.exec = function() {
      if (responder != null) responder();
      return this;
    };

    return Module;

  })();

}).call(this);
