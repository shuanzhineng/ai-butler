import { resolve } from 'path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// import { viteMockServe } from 'vite-plugin-mock';
import svgr from 'vite-plugin-svgr';
import tsMonoAlias from 'vite-plugin-ts-mono-alias';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

const isOnline = !!process.env.VITE_IS_ONLINE;
// console.log('isOnline', isOnline);



// // https://vitejs.dev/config/
// export default defineConfig({
//   base: '/',
//   publicDir: resolve(__dirname, 'public'),
//   envDir: resolve(__dirname, 'env'),
//   server: {
//     host: '0.0.0.0',
//     proxy: {
//       '/api': {
//         target: isOnline ? 'http://219.145.215.178:8001' : 'http://219.145.215.178:8001',
//         changeOrigin: true,
//       },
//     },
//   },

//   optimizeDeps: {
//     include: ['react/jsx-runtime'],
//   },

//   plugins: [
//     react(),
//     svgr(),
//     ViteEjsPlugin()
//     ,
//     !process.env.DIST &&
//     process.env.NODE_ENV !== 'production'
//     // &&
//     // tsMonoAlias({
//     //   // exact: true,
//     // }),
//   ].filter(Boolean),
//   resolve: {
//     alias: {
//       '@': resolve(__dirname, 'src/'),
//     },
//   },
//   build: {
//     target: 'es2015',
//     terserOptions: {
//       compress: {
//         drop_console: false,
//         drop_debugger: true,
//       },
//     },
//   },
// });


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根据不同的环境加载不同的配置文件
  const env = loadEnv(mode, process.cwd());

  return {
    base: '/',
    publicDir: resolve(__dirname, 'public'),
    envDir: resolve(__dirname, 'env'),
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: isOnline ? 'http://test-ai.shuanzhineng.com:9100' : 'http://test-ai.shuanzhineng.com:9100',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      svgr(),
      ViteEjsPlugin()
      ,
      !process.env.DIST &&
      process.env.NODE_ENV !== 'production'
      // &&
      // tsMonoAlias({
      //   // exact: true,
      // }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/'),
      },
    },
    build: {
      target: 'es2015',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true,
        },
      },
    },
    optimizeDeps: {
      include: ['react/jsx-runtime'],
    },
    define: {
      'process.env': env
    }
  };
});
