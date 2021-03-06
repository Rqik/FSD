const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const fs = require('fs');
const loader = require('sass-loader');

const PATHS = {
  src: path.join(__dirname, './src'),
  dist: path.join(__dirname, './dist'),
};
const PAGES_DIR = `${PATHS.src}/pug/pages/.`;
const PAGES = fs
  .readdirSync(PAGES_DIR)
  .filter((fileName) => fileName.endsWith('.pug'));
let pageName = '';

// точки входа
let entryName = {};
function entryPoints(page) {
  pageName = `${page.replace(/\.pug/, '')}`;
  entryName[pageName] = `./${pageName}.js`;
}

const plugins = () => {
  const base = [
    ...PAGES.map((page) => {
      entryPoints(page);
      return new HtmlWebpackPlugin({
        template: `${PAGES_DIR}/${page}`,
        filename: `./${page.replace(/\.pug/, '.html')}`,
        // костыль вроде [1]
        chunks: [`${page.replace(/\.pug/, '')}`],
      });
    }),

    new MiniCssExtractPlugin({
      filename: 'css/[name]-[hash:5]-bundle.css',
    }),
    new CleanWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'windows.jQuery': 'jquery',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: `${PATHS.src}/assets/img`,
          to: `${PATHS.dist}/img`,
        },
      ],
      options: {
        concurrency: 100,
      },
    }),
  ];

  if (isDev) {
    // only enable hot in development
    base.push(new webpack.HotModuleReplacementPlugin());
  }

  return base;
};

module.exports = {
  // target: "web",
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: entryName,
  output: {
    filename: 'js/[name]-[contenthash:5]-bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@fonts': path.resolve(__dirname, 'src/assets/fonts'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    // compress: true,
    port: 8008,
    hot: true,
  },
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(s[ca]ss|css)$/,
        use: [
          isDev
            ? 'style-loader'
            : {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  publicPath: '../',
                },
              },
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name][contenthash].[ext]',
            outputPath: 'img/',
          },
        },
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
        options: {
          name: '[name][contenthash].[ext]',
          outputPath: 'img/',
        },
      },
      {
        test: /\.(ttf|woff|woff2|eot|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name][contenthash:5].[ext]',
            outputPath: 'fonts/',
          },
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties'],
          },
        },
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader',
        options: {
          pretty: true,
        },
      },
    ],
  },
};
