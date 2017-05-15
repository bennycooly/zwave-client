
let path = require("path");
let HtmlWebpackPlugin = require("html-webpack-plugin");

const config = {
    entry: "./src/index.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "..", "dist")
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                exclude: /node-modules/
            },
            {
                test: /\.node$/,
                loader: "node-loader"
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", "html"]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html"
        })
    ],
    target: "electron-renderer"
};

module.exports = config;
