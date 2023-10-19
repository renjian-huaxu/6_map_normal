import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
export default [
    {
        input: './src/MThree',
        output: {
            format: 'umd',
            name: 'MThree',
            sourcemap: true,
            file: './build/MThree.js'
        },
        plugins: [
            commonjs(),
            babel({
                exclude: ['node_modules/**']
            })
        ]
    },
]