
let path = require("path");

const config = {
    entry: "./src/main.ts",
    output: {
        filename: "main.js",
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
        extensions: [".tsx", ".ts", ".js"]
    },
    target: "electron-main",
    node: {
        fs: "empty",
        __dirname: false
    }
};

module.exports = config;
