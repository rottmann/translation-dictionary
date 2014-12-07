/*global WITHOUT_EVENTS*/
'use strict';

if (typeof WITHOUT_EVENTS === 'undefined' || ! WITHOUT_EVENTS)
    var EventEmitter = require('eventemitter3').EventEmitter3;
if (typeof WITHOUT_EVENTS === 'undefined' || ! WITHOUT_EVENTS)
    var inherits     = require('inherits');
var sprintf      = require('sprintf-js').sprintf;
var vsprintf     = require('sprintf-js').vsprintf;

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
