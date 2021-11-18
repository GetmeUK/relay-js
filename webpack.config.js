var path = require('path');


module.exports = {
    entry: {
        'index': './module/index.js'
    },

    externals: {},

    output: {
        library: 'relay-ninja',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'umd'),
        filename: '[name].js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['@babel/preset-env']
                }
            },

            // -- Pre --

            // JS lint
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'eslint-loader',
                exclude: /node_modules/
            }
        ]
    },

    stats: {
        colors: true
    }
};
