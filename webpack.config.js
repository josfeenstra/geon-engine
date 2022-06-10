const path = require('path');


// setup webpack using the ts-loader
module.exports = [
{
    name: 'demo',
    // devtool: "eval-source-map", // just source-map is slower, but nicer
    entry: "./demo/index.ts", 
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'demo')]
            }
        ]
    },
    resolve : {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'build')
    },
    devServer: {
        filename: 'index.js',
        lazy: true,
        contentBase: path.join(__dirname, 'build'),
        
        // publicPath: "src",
        
        // path: path.resolve(__dirname, 'build'),
        
        // compress: true,
        // hot: true
    }
},
{
    name: 'lib',
    devtool: "eval-source-map", // just source-map is slower, but nicer
    entry: "./demo/index.ts", 
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'demo')]
            }
        ]
    },
    resolve : {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'build')
    },
    devServer: {
        filename: 'index.js',
        lazy: true,
        contentBase: path.join(__dirname, 'build'),
        
        // publicPath: "src",
        
        // path: path.resolve(__dirname, 'build'),
        
        // compress: true,
        // hot: true
    }
}];