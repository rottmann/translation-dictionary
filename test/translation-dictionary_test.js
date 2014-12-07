/* jshint expr:true */

var chai   = require('chai');
var spies  = require('chai-spies');
var expect = chai.expect;
chai.use(spies);

var TranslationDictionary = require('../');

describe('Translation Dictionary tests', function() {
    var dict;

    beforeEach(function() {
        dict = new TranslationDictionary();
    });

    it('check getLocale', function() {
        expect(dict.getLocale()).to.equal('en');
    });

    it('check pluralize with default pluralizer', function() {
        expect(dict._pluralize('en', 1)).not.to.equal(1); // 1 !== 1
        expect(dict._pluralize('en', 2)).to.equal(1);     // 2 !== 1
    });

    it('check pluralize with custom number pluralizer', function() {
        dict.registerPluralizer('en', 2);
        expect(dict._pluralize('en', 1)).to.equal(1);     // 1 !== 2
        expect(dict._pluralize('en', 2)).not.to.equal(1); // 2 !== 2
    });

    it('check pluralize with custom function pluralizer', function() {
        dict.registerPluralizer('en', function(value) {
            return (value > 10) ? 1 : 0;
        });
        expect(dict._pluralize('en', 9)).not.to.equal(1); // 9 > 10
        expect(dict._pluralize('en', 11)).to.equal(1);    // 11 > 10
    });

    it('check registerTranslation', function(done) {
        var spy = chai.spy(function() {
            done();
        });
        dict.on('registerTranslation', spy);
        dict.registerTranslation('de', {});
        expect(spy).to.have.been.called.with('de');
    });

    it('check setBaseLocale', function() {
        expect(dict.__('car')).to.equal('car');
        dict.setBaseLocale('de');
        expect(dict.__('auto')).to.equal('auto');
    });

    it('check setLocale and check translate', function() {
        expect(dict.__('car')).to.equal('car');

        dict.registerTranslation('de', {});
        dict.setLocale('de');
        expect(dict.__('car')).to.equal('car');

        dict.registerTranslation('de', { 'car': 'auto'});
        expect(dict.__('car')).to.equal('auto');

        dict.setLocale('en');
        expect(dict.__('car')).to.equal('car');
    });

    it('check translate parameter replace', function() {
        // args
        expect(dict.__('1 car')).to.equal('1 car');
        expect(dict.__('2 car %d', 47)).to.equal('2 car 47');
        expect(dict.__('3 car %d %s', 47, 'ABC')).to.equal('3 car 47 ABC');
        // array
        expect(dict.__('4 car %d', [ 47 ])).to.equal('4 car 47');
        expect(dict.__('5 car %d %s', [ 47, 'ABC' ])).to.equal('5 car 47 ABC');
        // object
        expect(dict.__('6 car %(param1)d', { param1: 47 })).to.equal('6 car 47');
        expect(dict.__('7 car %(param1)d %(param2)s', { param1: 47, param2: 'ABC' })).to.equal('7 car 47 ABC');
        // order
        expect(dict.__('8 car %2$s %1$s', [ 'ABC', 'DEF' ])).to.equal('8 car DEF ABC');
    });

    it('check _p parameter replace', function() {
        // args
        expect(dict._p('1 car', '1 cars', 1)).to.equal('1 car');
        expect(dict._p('2 car', '2 cars', 47)).to.equal('2 cars');
        expect(dict._p('3 car %d', '3 cars %d', 47)).to.equal('3 cars 47');
        expect(dict._p('4 car %d %s', '4 cars %d %s', 47, 'ABC')).to.equal('4 cars 47 ABC');
        // array
        expect(dict._p('5 car %d', '5 cars %d', [ 47 ])).to.equal('5 cars 47');
        expect(dict._p('6 car %d %s', '6 cars %d %s', [ 47, 'ABC' ])).to.equal('6 cars 47 ABC');
        // object
        expect(dict._p('7 car %(count)d', '7 cars %(count)d', { count: 47 })).to.equal('7 cars 47');
        expect(dict._p('8 car %(count)d %(param2)s', '8 cars %(count)d %(param2)s',
               { count: 47, param2: 'ABC' })).to.equal('8 cars 47 ABC');
        // order
        expect(dict._p('9 car %3$s %2$s', '9 cars %3$s %2$s', [ 47, 'ABC', 'DEF' ])).to.equal('9 cars DEF ABC');
    });

    it('check throw errors', function() {
        expect(dict.setLocale.bind(dict, 'de')).to.throw(/setLocale is called for an unregistered translation/);
        expect(dict._p.bind(dict, 'car', 1)).to.throw(/for plural must be a string/);
        expect(dict._p.bind(dict, 'car', 'cars')).to.throw(/numeric value is missing/);
        expect(dict._p.bind(dict)).to.throw(/plural string and numeric value are missing/);
    });

    it('check translate emit missingTranslation', function(done) {
        var spy = chai.spy(function() {
            done();
        });
        dict.on('missingTranslation', spy);
        dict.registerTranslation('de', {});
        dict.setLocale('de');
        dict.__('car');
        expect(spy).to.have.been.called.with('car', 'de');
    });

    it('check translate emit missingPluralTranslation', function(done) {
        var spy = chai.spy(function() {
            done();
        });
        dict.on('missingPluralTranslation', spy);
        dict.registerTranslation('de', {
            'cars': []
        });
        dict.setLocale('de');
        dict._p('car', 'cars', 47);
        expect(spy).to.have.been.called.with('cars', 'de');
    });

    it('check translation from baseLocale en to cs (from 2 to 3 plurals)', function() {
        dict.registerPluralizer('cs', function(n) {
            return (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;
        }, 3);

        dict.registerTranslation('cs', {
            'wolve' : 'vlk',
            'wolves': [
                'vlci',
                'vlků'
            ]
        });

        dict.setLocale('cs');

        expect(dict._p('wolve', 'wolves', 1)).to.equal('vlk');
        expect(dict._p('wolve', 'wolves', 2)).to.equal('vlci');
        expect(dict._p('wolve', 'wolves', 3)).to.equal('vlci');
        expect(dict._p('wolve', 'wolves', 4)).to.equal('vlci');
        expect(dict._p('wolve', 'wolves', 5)).to.equal('vlků');
    });

    it('check translation from baseLocale cs to en (from 2 to 3 plurals) ', function() {
        dict.setBaseLocale('cs', 3);

        dict.registerPluralizer('cs', function(n) {
            return (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;
        }, 3);

        dict.registerTranslation('en', {
            'vlk' : 'wolve',
            'vlci': 'wolves',
            'vlků': 'wolves'
        });

        dict.setLocale('en');

        expect(dict._p('vlk', 'vlci', 'vlků', 1)).to.equal('wolve');
        expect(dict._p('vlk', 'vlci', 'vlků', 2)).to.equal('wolves');
        expect(dict._p('vlk', 'vlci', 'vlků', 3)).to.equal('wolves');
        expect(dict._p('vlk', 'vlci', 'vlků', 4)).to.equal('wolves');
        expect(dict._p('vlk', 'vlci', 'vlků', 5)).to.equal('wolves');
    });

    it('check translation from baseLocale ex3 to ex5 (from 3 to 5 plurals)', function() {
        dict.setBaseLocale('ex3', 3);

        dict.registerPluralizer('ex3', function(n) {
            return (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;
        }, 3);

        dict.registerPluralizer('ex5', function(n) {
            return (n === 1) ? 0 : (n === 2) ? 1 : (n === 3) ? 2 : (n === 4) ? 3 : 4;
        }, 5);

        dict.registerTranslation('ex5', {
            'singular3': 'singular5',
            'plural3-1': [
                'plural5-1',
                'plural5-2',
                'plural5-3',
                'plural5-4'
            ],
            'plural3-2': [
                'plural5-1 not used',
                'plural5-2 not used',
                'plural5-3 not used',
                'plural5-5'
            ]
        });

        dict.setLocale('ex5');

        expect(dict._p('singular3', 'plural3-1', 'plural3-2', 1)).to.equal('singular5');
        expect(dict._p('singular3', 'plural3-1', 'plural3-2', 2)).to.equal('plural5-1');
        expect(dict._p('singular3', 'plural3-1', 'plural3-2', 3)).to.equal('plural5-2');
        expect(dict._p('singular3', 'plural3-1', 'plural3-2', 4)).to.equal('plural5-3');
        expect(dict._p('singular3', 'plural3-1', 'plural3-2', 5)).to.equal('plural5-5');
    });

    it('check translation from baseLocale ex5 to ex3 (from 5 to 3 plurals)', function() {
        dict.setBaseLocale('ex5', 5);

        dict.registerPluralizer('ex3', function(n) {
            return (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;
        }, 3);

        dict.registerPluralizer('ex5', function(n) {
            return (n === 1) ? 0 : (n === 2) ? 1 : (n === 3) ? 2 : (n === 4) ? 3 : 4;
        }, 5);

        dict.registerTranslation('ex3', {
            'singular5': 'singular3',
            'plural5-1': [
                'plural3-1',
                'plural3-2 not used'
            ],
            'plural5-2': [
                'plural3-3',
                'plural3-4 not used'
            ],
            'plural5-3': [
                'plural3-5',
                'plural3-6 not used'
            ],
            'plural5-4': [
                'plural3-7 not used',
                'plural3-8'
            ]
        });

        dict.setLocale('ex3');

        expect(dict._p('singular5', 'plural5-1', 'plural5-2', 'plural5-3', 'plural5-4', 1)).to.equal('singular3');
        expect(dict._p('singular5', 'plural5-1', 'plural5-2', 'plural5-3', 'plural5-4', 2)).to.equal('plural3-1');
        expect(dict._p('singular5', 'plural5-1', 'plural5-2', 'plural5-3', 'plural5-4', 3)).to.equal('plural3-3');
        expect(dict._p('singular5', 'plural5-1', 'plural5-2', 'plural5-3', 'plural5-4', 4)).to.equal('plural3-5');
        expect(dict._p('singular5', 'plural5-1', 'plural5-2', 'plural5-3', 'plural5-4', 5)).to.equal('plural3-8');
        expect(dict._p('singular5', 'plural5-1', 'plural5-2', 'plural5-3', 'plural5-4', 6)).to.equal('plural3-8');
    });

});
