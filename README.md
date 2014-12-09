# translation-dictionary

JavaScript gettext-style translation output library with [sprintf-js](https://github.com/alexei/sprintf.js) parameter replace.

[![Build Status](https://travis-ci.org/rottmann/translation-dictionary.svg?branch=master)](https://travis-ci.org/rottmann/translation-dictionary)
[![Dependency Status](https://david-dm.org/rottmann/translation-dictionary.svg)](https://david-dm.org/rottmann/translation-dictionary)
[![NPM version](https://badge.fury.io/js/translation-dictionary.svg)](http://badge.fury.io/js/translation-dictionary)


## Install

#### Node.js
`$ npm install translation-dictionary`


#### Browser
`$ bower install translation-dictionary`

```html
<!-- with EventEmitter ~9 kb -->
<script src="bower_components/translation-dictionary/build/translation-dictionary.min.js"></script>

<!-- or without EventEmitter ~6.4 kb -->
<script src="bower_components/translation-dictionary/build/translation-dictionary.woe.min.js"></script>
```


## Usage
```js
var dict = new TranslationDictionary();

dict.registerTranslation('de', {
    'I have a car'               : 'Ich habe ein Auto',
    'I have %d cars'             : 'Ich habe %d Autos',
    'Hello %s %s'                : 'Hallo %s %s',
    'Name: %2$s, Firstname: %1$s': 'Name: %2$s, Vorname: %1$s',
    'Named arguments %(arg1)s'   : 'Benannte Argumente %(arg1)s'
});
dict.setLocale('de');

dict.__('I have a car');                                  // 'Ich habe ein Auto'
dict._p('I have a car', 'I have %d cars', 2);             // 'Ich habe 2 Autos'
dict.__('Hello %s %s', 'John', 'Doe');                    // 'Hallo John Doe'
dict.__('Name: %2$s, Firstname: %1$s', 'John', 'Doe');    // 'Name: Doe, Vorname: John'
dict.__('Named arguments %(arg1)s', { arg1: 'inserted'}); // 'Named arguments inserted'
```

View [example/](example/) for detailed examples.


## API

#### getLocale ()

Return the current locale (default: 'en').


#### registerPluralizer (locale, pluralizer[, nPlurals=2])

Set a pluralizer for a locale with the number of plurals.
Visit [localization-guide](http://localization-guide.readthedocs.org/en/latest/l10n/pluralforms.html) for pluralforms and [unicode.org](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) for details and examples.

```js
registerPluralizer('cs', function(n) {
    return (n === 1) ? 0 : ( n >= 2 && n <= 4) ? 1 : 2;
}, 3);
```


#### registerTranslation (locale, translations)

Merge translations to a locale.

```js
// nPlurals=2 in german
registerTranslation('de', {
    'wolve' : 'wolf',
    'wolves': 'wölfe'
});

// nPlurals=3 in czech
dict.registerTranslation('cs', {
    'wolve' : 'vlk',
    'wolves': [
        'vlci',
        'vlků'
    ]
});
```


#### setBaseLocale (locale[, nPlurals=2])

Set the applications base language.


#### setLocale (locale)

Set the current locale.


#### translate (_arguments_)

Translate a singular text.

arguments[0] The text to translate.
[arguments[n]] Optional parameters for sprintf to replace markers in the text.

Depending on the markers a list of parameters, an array, or an object can be used.

```js
translate('a text');
translate('a text %s %s', 'str1', 'str2');
translate('a text %s %s', [ 'str1', 'str2' ]);
translate('a text %(name)s', { name: 'John Doe' });
```


#### \_\_ (_arguments_)

Alias for translate ().


#### translatePlural (_arguments_)

Translate a text as singular or plural, depending on the count.

arguments[0] The singular text to translate.
arguments[1..(nPlurals-1)] The plural text to translate.
arguments[nPlurals..n]     The count and parameters for sprintf to replace markers in the text.

Depending on the markers a list of parameters, an array, or an object can be used.

```js
translatePlural('a text', 'some text', 47);
translatePlural('a text %d %s', 'some text %d %s', 47, 'str1');
translatePlural('a text %d %s', 'some text %d %s', [ 47, 'str1' ]);
translatePlural('a text %(name)s', 'some text %(name)s', { count: 47, name: 'John Doe' });
```


#### \_p (_arguments_)

Alias for translatePlural ().
