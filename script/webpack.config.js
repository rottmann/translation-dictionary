var webpack = require('webpack');
var pkg     = require('../package.json');

module.exports = {
    entry: './index.js',
    sourceMapFilename: 'translation-dictionary.js.map',
    output: {
        path         : './build',
        filename     : 'translation-dictionary.js',
        library      : 'TranslationDictionary',
        libraryTarget: 'umd'
    },
    plugins: [
        new webpack.BannerPlugin(pkg.name + ' v' + pkg.version + ' | ' + pkg.homepage + ' | ' + pkg.author + ' | ' +
                                 pkg.license)
    ]
};
