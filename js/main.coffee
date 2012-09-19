class Module

	responder = null

	constructor: (name) ->
		if name? then WEX.bind name, @exec

	trigger: (fn) ->
		do fn if $.isFunction fn
		@

	respond: (fn) ->
		responder = fn if $.isFunction fn
		@

	exec: ->
		do responder if responder?
		@