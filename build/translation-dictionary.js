/*! translation-dictionary v0.1.0 | https://github.com/rottmann/translation-dictionary | Peter Rottmann <rottmann@inveris.de> | MIT */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["TranslationDictionary"] = factory();
	else
		root["TranslationDictionary"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(1)


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/*global WITHOUT_EVENTS*/
	'use strict';

	if (typeof WITHOUT_EVENTS === 'undefined' || ! WITHOUT_EVENTS)
	    var EventEmitter = __webpack_require__(2).EventEmitter3;
	if (typeof WITHOUT_EVENTS === 'undefined' || ! WITHOUT_EVENTS)
	    var inherits     = __webpack_require__(3);
	var sprintf      = __webpack_require__(4).sprintf;
	var vsprintf     = __webpack_require__(4).vsprintf;

	/**
	 * Polyfill
	 */
	if ( ! Number.isInteger)
	    Number.isInteger = function(value) {
	        return typeof value === 'number' &&
	            isFinite(value) &&
	            value > -9007199254740992 &&
	            value < 9007199254740992 &&
	            Math.floor(value) === value;
	    };

	if ( ! Array.isArray)
	    Array.isArray = function(args) {
	        return Object.prototype.toString.call(args) === '[object Array]';
	    };

	/**
	 * Defaults
	 */
	var DEFAULT_LOCALE = 'en';
	var DEFAULT_NPLURALS = 2;
	var DEFAULT_PLURALIZER = 1;

	/**
	 * TranslationDictionary
	 *
	 * @fires changeBaseLocale (locale)               Emitted after baseLocale changed.
	 * @fires changeLocale (locale)                   Emitted after locale changed.
	 * @fires changeTranslation (locale)              Emitted after translation of the current locale changed.
	 * @fires missingPluralTranslation (text, locale) Emitted when the plural text is not found in translation.
	 * @fires missingTranslation (text, locale)       Emitted when the text is not found in translation.
	 * @fires registerPluralizer (locale, pluralizer) Emitted after a new pluralizer was registered.
	 * @fires registerTranslation (locale)            Emitted after a new translation was registered.
	 */
	var TranslationDictionary = function() {
	    this.baseLocale = DEFAULT_LOCALE;
	    this.baseNPlurals = DEFAULT_NPLURALS;
	    this.cache = {}; // cache for current locale
	    this.dict = {};
	    this.locale = DEFAULT_LOCALE;
	    this.nPlurals = {};
	    this.pluralizers = {};
	    this._createDictionary(this.baseLocale);
	};

	if (typeof WITHOUT_EVENTS === 'undefined' || ! WITHOUT_EVENTS)
	    inherits(TranslationDictionary, EventEmitter);

	/**
	 * Get the current locale (default: 'en')
	 *
	 * @return {string}
	 */
	TranslationDictionary.prototype.getLocale = function() {
	    return this.locale;
	};

	/**
	 * Set a pluralizer for a locale with number of plurals
	 *
	 * @param {string}       locale       The locale for which to register the pluralizer.
	 * @param {callback|int} pluralizer   A callback(number) that returns the index of the plural in dict[text].
	 * @param {int}          [nPlurals=2] Number of plurals the language has.
	 */
	TranslationDictionary.prototype.registerPluralizer = function(locale, pluralizer, nPlurals) {
	    this.pluralizers[locale] = pluralizer;
	    this.nPlurals[locale] = nPlurals || DEFAULT_NPLURALS;
	    this.cache = {};
	    this.emit('registerPluralizer', locale, pluralizer);
	};

	/**
	 * Merge translations to a locale
	 *
	 * @param {string} locale       The locale for which to register the translation.
	 * @param {object} translations An Object with the base locale text as key and the translation as value.
	 *        {
	 *            'wolve' : 'vlk',
	 *            'wolves': [ // nPlurals for Czech is 3
	 *               'vlci',
	 *               'vlků'
	 *           ]
	 *         }
	 */
	TranslationDictionary.prototype.registerTranslation = function(locale, translations) {
	    this._createDictionary(locale);

	    // extend / overwrite dict entries
	    for (var text in translations) /*jshint -W089 */
	        this.dict[locale][text] = translations[text];

	    this.emit('registerTranslation', locale);

	    // emit when translation of the current locale changed
	    if (locale === this.locale && locale !== this.baseLocale)
	        this.emit('changeTranslation', locale);
	};

	/**
	 * Set the applications base language
	 * 
	 * @param {string} locale   Applications base locale.
	 * @param {int}    nPlurals Number of plurals the base locale has.
	 */
	TranslationDictionary.prototype.setBaseLocale = function(locale, nPlurals) {
	    this.baseLocale = locale;
	    this.baseNPlurals = nPlurals || DEFAULT_NPLURALS;
	    this._createDictionary(locale); // ensure that an empty dictionary for the locale exists
	    this.emit('changeBaseLocale', locale);
	};

	/**
	 * Set the current locale
	 * 
	 * @param {string} locale The locale registered before with registerTranslation / application base locale.
	 */
	TranslationDictionary.prototype.setLocale = function(locale) {
	    if (locale === this.locale)
	        return;
	    if ( ! this.dict[locale])
	        throw new Error('[dict] setLocale is called for an unregistered translation');

	    this.locale = locale;
	    this.cache = {};
	    this.emit('changeLocale', locale);
	};

	/**
	 * Translate a singular text
	 * 
	 * @param {string} arguments[0]   The text to translate.
	 * @param {mixed}  [arguments[n]] Optional parameters for sprintf to replace markers in the text.
	 *        Depending on the markers a list of parameters, an array, or an object can be used.
	 *        translate('a text');
	 *        translate('a text %s %s', 'str1', 'str2');
	 *        translate('a text %s %s', [ 'str1', 'str2' ]);
	 *        translate('a text %(name)s', { name: 'John Doe' });
	 * 
	 * @return {string} Translated text.
	 */
	TranslationDictionary.prototype.translate = function(/*arguments*/) {
	    return this._translate(arguments);
	};

	/**
	 * Alias for translate()
	 */
	TranslationDictionary.prototype.__ = function(/*arguments*/) {
	    return this._translate(arguments);
	};


	/**
	 * Translate a text as singular or plural, depending on the count
	 * 
	 * @param {string} arguments[0]               The singular text to translate.
	 * @param {string} arguments[1..(nPlurals-1)] The plural text to translate.
	 * @param {mixed}  arguments[nPlurals..n]     The count and parameters for sprintf to replace markers in the text.
	 *        Depending on the markers a list of parameters, an array, or an object can be used.
	 *        translatePlural('a text', 'some text', 47);
	 *        translatePlural('a text %d %s', 'some text %d %s', 47, 'str1');
	 *        translatePlural('a text %d %s', 'some text %d %s', [ 47, 'str1' ]);
	 *        translatePlural('a text %(name)s', 'some text %(name)s', { count: 47, name: 'John Doe' });
	 * 
	 * @return {string} Translated text.
	 */
	TranslationDictionary.prototype.translatePlural = function(/*arguments*/) {
	    return this._translate(arguments, true);
	};

	/**
	 * Alias for translatePlural()
	 */
	TranslationDictionary.prototype._p = function(/*arguments*/) {
	    return this._translate(arguments, true);
	};

	/**
	 * Translation function called from translate() and translatePlural()
	 * 
	 * @param  {mixed}   args       Arguments from the calling functions.
	 * @param  {boolean} withPlural With plural detection.
	 * @return {string} Translated text.
	 */
	TranslationDictionary.prototype._translate = function(args, withPlural) {
	    // cache
	    var hash = JSON.stringify(arguments);
	    if (hash in this.cache)
	        return this.cache[hash];

	    var index = 0;
	    var params; // int / array / object
	    var bnp = this.baseNPlurals;
	    var number;

	    if (withPlural) {
	        if (args.length >= bnp) {
	            if (typeof args[bnp - 1] !== 'string')
	                throw new Error('[dict] parameter ' + bnp + ' for plural must be a string for \'' + args[0] + '\'');

	            params = (args.length > (bnp + 1)) ? Array.prototype.slice.call(args, bnp) : args[bnp];

	            if (Number.isInteger(params))
	                number = params;
	            else {
	                if (Array.isArray(params)) {
	                    if ( ! params[0])
	                        throw new Error('[dict] parameter array is empty for \'' + args[0] + '\'');
	                    number = params[0];
	                }
	                else if (typeof params === 'object') {
	                    if ( ! params.count)
	                        throw new Error('[dict] numeric object.count is missing for \'' + args[0] + '\'');
	                    number = params.count;
	                }
	                if ( ! Number.isInteger(number))
	                    throw new Error('[dict] numeric value is missing for \'' + args[0] + '\'');
	            }

	            index = this._pluralize(this.baseLocale, number);
	        } else {
	            throw new Error('[dict] plural string and numeric value are missing for \'' + args[0] + '\'');
	        }
	    }
	    else {
	        params = (args.length > bnp) ? Array.prototype.slice.call(args, (bnp - 1)) : args[(bnp - 1)];
	    }

	    var text = args[index];
	    if (this.locale !== this.baseLocale) {
	        var dictText = this.dict[this.locale][text];
	        if (dictText)
	            if (typeof dictText === 'string') {
	                text = dictText;
	            } else {
	                var localeIndex = this._pluralize(this.locale, number);
	                if (dictText.length >= localeIndex)
	                    text = dictText[localeIndex - 1];
	                else
	                    this.emit('missingPluralTranslation', text, this.locale);
	            }
	        else
	            this.emit('missingTranslation', text, this.locale);
	    }

	    if (typeof params !== 'undefined')
	        if (Array.isArray(params))
	            text = vsprintf(text, params);
	        else
	            text = sprintf(text, params);

	    this.cache[hash] = text;
	    return text;
	};

	/**
	 * Create a dictionary if not exists for a locale
	 * Set default pluralizer and clear the cache.
	 * 
	 * @param  {string} locale The locale.
	 */
	TranslationDictionary.prototype._createDictionary = function(locale) {
	    if ( ! this.dict[locale])
	        this.dict[locale] = {};

	    if ( ! this.pluralizers[locale])
	        this.registerPluralizer(locale, DEFAULT_PLURALIZER);

	    this.cache = {};
	};

	/**
	 * Execute the pluralizer
	 * 
	 * @param  {string} locale The locale for which the pluralizer should be used.
	 * @param  {int}    number The number to check and get the plural index.
	 * @return {int} Index of the plural form in dict[text].
	 */
	TranslationDictionary.prototype._pluralize = function(locale, number) {
	    var pluralizer = this.pluralizers[locale];
	    if (typeof pluralizer === 'function')
	        return pluralizer.call(this, number);
	    else
	        return number !== pluralizer ? 1 : 0;
	};

	if (typeof WITHOUT_EVENTS === 'undefined' || ! WITHOUT_EVENTS)
	    TranslationDictionary.prototype.emmit = function() { };

	module.exports = TranslationDictionary;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * Representation of a single EventEmitter function.
	 *
	 * @param {Function} fn Event handler to be called.
	 * @param {Mixed} context Context for function execution.
	 * @param {Boolean} once Only emit once
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Minimal EventEmitter interface that is molded against the Node.js
	 * EventEmitter interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() { /* Nothing to set */ }

	/**
	 * Holds the assigned EventEmitters by name.
	 *
	 * @type {Object}
	 * @private
	 */
	EventEmitter.prototype._events = undefined;

	/**
	 * Return a list of assigned event listeners.
	 *
	 * @param {String} event The events that should be listed.
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event) {
	  if (!this._events || !this._events[event]) return [];
	  if (this._events[event].fn) return [this._events[event].fn];

	  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
	    ee[i] = this._events[event][i].fn;
	  }

	  return ee;
	};

	/**
	 * Emit an event to all registered event listeners.
	 *
	 * @param {String} event The name of the event.
	 * @returns {Boolean} Indication if we've emitted an event.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  if (!this._events || !this._events[event]) return false;

	  var listeners = this._events[event]
	    , len = arguments.length
	    , args
	    , i;

	  if ('function' === typeof listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Register a new EventListener for the given event.
	 *
	 * @param {String} event Name of the event.
	 * @param {Functon} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this);

	  if (!this._events) this._events = {};
	  if (!this._events[event]) this._events[event] = listener;
	  else {
	    if (!this._events[event].fn) this._events[event].push(listener);
	    else this._events[event] = [
	      this._events[event], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Add an EventListener that's only called once.
	 *
	 * @param {String} event Name of the event.
	 * @param {Function} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true);

	  if (!this._events) this._events = {};
	  if (!this._events[event]) this._events[event] = listener;
	  else {
	    if (!this._events[event].fn) this._events[event].push(listener);
	    else this._events[event] = [
	      this._events[event], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Remove event listeners.
	 *
	 * @param {String} event The event we want to remove.
	 * @param {Function} fn The listener that we need to find.
	 * @param {Boolean} once Only remove once listeners.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
	  if (!this._events || !this._events[event]) return this;

	  var listeners = this._events[event]
	    , events = [];

	  if (fn) {
	    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
	      events.push(listeners);
	    }
	    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
	      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
	        events.push(listeners[i]);
	      }
	    }
	  }

	  //
	  // Reset the array, or remove it completely if we have no more listeners.
	  //
	  if (events.length) {
	    this._events[event] = events.length === 1 ? events[0] : events;
	  } else {
	    delete this._events[event];
	  }

	  return this;
	};

	/**
	 * Remove all listeners or only the listeners for the specified event.
	 *
	 * @param {String} event The event want to remove all listeners for.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  if (!this._events) return this;

	  if (event) delete this._events[event];
	  else this._events = {};

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};

	//
	// Expose the module.
	//
	EventEmitter.EventEmitter = EventEmitter;
	EventEmitter.EventEmitter2 = EventEmitter;
	EventEmitter.EventEmitter3 = EventEmitter;

	//
	// Expose the module.
	//
	module.exports = EventEmitter;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	(function(window) {
	    var re = {
	        not_string: /[^s]/,
	        number: /[dief]/,
	        text: /^[^\x25]+/,
	        modulo: /^\x25{2}/,
	        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fiosuxX])/,
	        key: /^([a-z_][a-z_\d]*)/i,
	        key_access: /^\.([a-z_][a-z_\d]*)/i,
	        index_access: /^\[(\d+)\]/,
	        sign: /^[\+\-]/
	    }

	    function sprintf() {
	        var key = arguments[0], cache = sprintf.cache
	        if (!(cache[key] && cache.hasOwnProperty(key))) {
	            cache[key] = sprintf.parse(key)
	        }
	        return sprintf.format.call(null, cache[key], arguments)
	    }

	    sprintf.format = function(parse_tree, argv) {
	        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
	        for (i = 0; i < tree_length; i++) {
	            node_type = get_type(parse_tree[i])
	            if (node_type === "string") {
	                output[output.length] = parse_tree[i]
	            }
	            else if (node_type === "array") {
	                match = parse_tree[i] // convenience purposes only
	                if (match[2]) { // keyword argument
	                    arg = argv[cursor]
	                    for (k = 0; k < match[2].length; k++) {
	                        if (!arg.hasOwnProperty(match[2][k])) {
	                            throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
	                        }
	                        arg = arg[match[2][k]]
	                    }
	                }
	                else if (match[1]) { // positional argument (explicit)
	                    arg = argv[match[1]]
	                }
	                else { // positional argument (implicit)
	                    arg = argv[cursor++]
	                }

	                if (get_type(arg) == "function") {
	                    arg = arg()
	                }

	                if (re.not_string.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
	                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
	                }

	                if (re.number.test(match[8])) {
	                    is_positive = arg >= 0
	                }

	                switch (match[8]) {
	                    case "b":
	                        arg = arg.toString(2)
	                    break
	                    case "c":
	                        arg = String.fromCharCode(arg)
	                    break
	                    case "d":
	                    case "i":
	                        arg = parseInt(arg, 10)
	                    break
	                    case "e":
	                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
	                    break
	                    case "f":
	                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
	                    break
	                    case "o":
	                        arg = arg.toString(8)
	                    break
	                    case "s":
	                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
	                    break
	                    case "u":
	                        arg = arg >>> 0
	                    break
	                    case "x":
	                        arg = arg.toString(16)
	                    break
	                    case "X":
	                        arg = arg.toString(16).toUpperCase()
	                    break
	                }
	                if (re.number.test(match[8]) && (!is_positive || match[3])) {
	                    sign = is_positive ? "+" : "-"
	                    arg = arg.toString().replace(re.sign, "")
	                }
	                else {
	                    sign = ""
	                }
	                pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
	                pad_length = match[6] - (sign + arg).length
	                pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
	                output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
	            }
	        }
	        return output.join("")
	    }

	    sprintf.cache = {}

	    sprintf.parse = function(fmt) {
	        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0
	        while (_fmt) {
	            if ((match = re.text.exec(_fmt)) !== null) {
	                parse_tree[parse_tree.length] = match[0]
	            }
	            else if ((match = re.modulo.exec(_fmt)) !== null) {
	                parse_tree[parse_tree.length] = "%"
	            }
	            else if ((match = re.placeholder.exec(_fmt)) !== null) {
	                if (match[2]) {
	                    arg_names |= 1
	                    var field_list = [], replacement_field = match[2], field_match = []
	                    if ((field_match = re.key.exec(replacement_field)) !== null) {
	                        field_list[field_list.length] = field_match[1]
	                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
	                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
	                                field_list[field_list.length] = field_match[1]
	                            }
	                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
	                                field_list[field_list.length] = field_match[1]
	                            }
	                            else {
	                                throw new SyntaxError("[sprintf] failed to parse named argument key")
	                            }
	                        }
	                    }
	                    else {
	                        throw new SyntaxError("[sprintf] failed to parse named argument key")
	                    }
	                    match[2] = field_list
	                }
	                else {
	                    arg_names |= 2
	                }
	                if (arg_names === 3) {
	                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
	                }
	                parse_tree[parse_tree.length] = match
	            }
	            else {
	                throw new SyntaxError("[sprintf] unexpected placeholder")
	            }
	            _fmt = _fmt.substring(match[0].length)
	        }
	        return parse_tree
	    }

	    var vsprintf = function(fmt, argv, _argv) {
	        _argv = (argv || []).slice(0)
	        _argv.splice(0, 0, fmt)
	        return sprintf.apply(null, _argv)
	    }

	    /**
	     * helpers
	     */
	    function get_type(variable) {
	        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
	    }

	    function str_repeat(input, multiplier) {
	        return Array(multiplier + 1).join(input)
	    }

	    /**
	     * export to either browser or node.js
	     */
	    if (true) {
	        exports.sprintf = sprintf
	        exports.vsprintf = vsprintf
	    }
	    else {
	        window.sprintf = sprintf
	        window.vsprintf = vsprintf

	        if (typeof define === "function" && define.amd) {
	            define(function() {
	                return {
	                    sprintf: sprintf,
	                    vsprintf: vsprintf
	                }
	            })
	        }
	    }
	})(typeof window === "undefined" ? this : window);


/***/ }
/******/ ])
});
