const path = require('path');

module.exports = {
    entry: {
        game: './public/js/game.ts'
    },
    // devtool: 'inline-source-map',
    mode: "development",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                   {
                        loader: 'ts-loader',
                        options: {
                            configFile: '../tsconfig.json'
                        } 
                   } 
                ],
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx'],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '../dist/public/js')
    }
}