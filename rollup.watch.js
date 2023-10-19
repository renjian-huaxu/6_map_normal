// rollup.watch.js
const rollup = require('rollup');
const babel = require("rollup-plugin-babel");

const watchOptions = {
    input: './src/MThree',
    output: {
        format: 'umd',
        name: 'MThree',
        sourcemap: true,
        file: './build/MThree.js'
    },
    plugins: [
        babel({
            exclude: ['node_modules/**']
        })
    ]
}
const watcher = rollup.watch(watchOptions);

console.log('Rollup is watching for changes...');

watcher.on('event', event => {
    switch (event.code) {
        case 'START':
            console.info('Rebuilding...');
            break;
        case 'BUNDLE_START':
            console.info('Bundling...');
            break;
        case 'BUNDLE_END':
            console.info('Bundled!');
            break;
        case 'END':
            console.info('Done!');
            break;
        case 'ERROR':
        case 'FATAL':
            console.error("Rollup error: ", event);
    }
});

process.on('exit', () => {
    // 停止监听
    watcher.close();
});
