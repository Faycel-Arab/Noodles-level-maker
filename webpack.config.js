const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        app: './src/index.js'
    },
    devServer: {
        contentBase: './dist'
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: { presets: ['env'] }
                }
                
            },
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use:[{
                        loader: 'file-loader',
                }]
            }
        ]
    },
    resolve: { extensions: ['*', '.js', '.jsx'] },
    plugins: [
        new CopyWebpackPlugin([
            {from: "./src/assets/tiles", to:"./tiles"},
            {from: "./src/assets/loaders", to: "./loaders"}
        ])
    ]
};