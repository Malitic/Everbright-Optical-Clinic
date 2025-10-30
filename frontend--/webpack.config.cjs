const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
	entry: path.resolve(__dirname, 'src/index.tsx'),
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'assets/[name].[contenthash].js',
		publicPath: '/',
		clean: true,
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env', { targets: 'defaults' }],
							['@babel/preset-react', { runtime: 'automatic' }],
							'@babel/preset-typescript',
						],
					},
				},
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader', 'postcss-loader'],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, 'public/index.html'),
			title: 'EverBright Optical Clinic Management System',
		}),
		new webpack.DefinePlugin({
			'import.meta.env': JSON.stringify({
				VITE_API_URL: process.env.VITE_API_URL || process.env.REACT_APP_API_URL || '',
				VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || '',
				VITE_WEBSOCKET_URL: process.env.VITE_WEBSOCKET_URL || process.env.REACT_APP_WEBSOCKET_URL || '',
			}),
		}),
	],
	devServer: {
		port: process.env.PORT ? Number(process.env.PORT) : 5173,
		historyApiFallback: true,
		static: path.resolve(__dirname, 'public'),
		open: false,
		allowedHosts: 'all',
		client: {
			overlay: true,
		},
		proxy: {
			'/api': {
				target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000',
				changeOrigin: true,
				secure: false,
			},
			'/api': {
				target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000',
				changeOrigin: true,
				secure: false,
			},
		},
	},
};




