// vite.config.ts
import { defineConfig, loadEnv } from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/vite/dist/node/index.js";
import { resolve as resolve2 } from "path";

// build/getEnv.ts
function wrapperEnv(envConf) {
  const ret = {};
  for (const envName of Object.keys(envConf)) {
    let realName = envConf[envName].replace(/\\n/g, "\n");
    realName = realName === "true" ? true : realName === "false" ? false : realName;
    if (envName === "VITE_PORT") realName = Number(realName);
    if (envName === "VITE_PROXY") {
      try {
        realName = JSON.parse(realName);
      } catch (error) {
        realName = [];
      }
    }
    ret[envName] = realName;
  }
  return ret;
}

// build/proxy.ts
function createProxy(list = []) {
  const ret = {};
  for (const [prefix, target] of list) {
    const httpsRE = /^https:\/\//;
    const isHttps = httpsRE.test(target);
    ret[prefix] = {
      target,
      changeOrigin: true,
      ws: true,
      rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ""),
      // https is require secure=false
      ...isHttps ? { secure: false } : {}
    };
  }
  return ret;
}

// build/plugins.ts
import { resolve } from "path";
import { VitePWA } from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/vite-plugin-pwa/dist/index.js";
import { createHtmlPlugin } from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/vite-plugin-html/dist/index.mjs";
import { visualizer } from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { createSvgIconsPlugin } from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/vite-plugin-svg-icons/dist/index.mjs";
import vue from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import eslintPlugin from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/vite-plugin-eslint/dist/index.mjs";
import viteCompression from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/vite-plugin-compression/dist/index.mjs";
import vueSetupExtend from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/unplugin-vue-setup-extend-plus/dist/vite.js";
import NextDevTools from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
import { codeInspectorPlugin } from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/code-inspector-plugin/dist/index.mjs";
var createVitePlugins = (viteEnv) => {
  const { VITE_GLOB_APP_TITLE, VITE_REPORT, VITE_DEVTOOLS, VITE_PWA, VITE_CODEINSPECTOR } = viteEnv;
  return [
    vue(),
    // vue 可以使用 jsx/tsx 语法
    vueJsx(),
    // devTools
    VITE_DEVTOOLS && NextDevTools({ launchEditor: "code" }),
    // esLint 报错信息显示在浏览器界面上
    eslintPlugin(),
    // name 可以写在 script 标签上
    vueSetupExtend({}),
    // 创建打包压缩配置
    createCompression(viteEnv),
    // 注入变量到 html 文件
    createHtmlPlugin({
      minify: true,
      inject: {
        data: { title: VITE_GLOB_APP_TITLE }
      }
    }),
    // 使用 svg 图标
    createSvgIconsPlugin({
      iconDirs: [resolve(process.cwd(), "src/assets/icons")],
      symbolId: "icon-[dir]-[name]"
    }),
    // vitePWA
    VITE_PWA && createVitePwa(viteEnv),
    // 是否生成包预览，分析依赖包大小做优化处理
    VITE_REPORT && visualizer({ filename: "stats.html", gzipSize: true, brotliSize: true }),
    // 自动 IDE 并将光标定位到 DOM 对应的源代码位置。see: https://inspector.fe-dev.cn/guide/start.html
    VITE_CODEINSPECTOR && codeInspectorPlugin({
      bundler: "vite"
    })
  ];
};
var createCompression = (viteEnv) => {
  const { VITE_BUILD_COMPRESS = "none", VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE } = viteEnv;
  const compressList = VITE_BUILD_COMPRESS.split(",");
  const plugins = [];
  if (compressList.includes("gzip")) {
    plugins.push(
      viteCompression({
        ext: ".gz",
        algorithm: "gzip",
        deleteOriginFile: VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE
      })
    );
  }
  if (compressList.includes("brotli")) {
    plugins.push(
      viteCompression({
        ext: ".br",
        algorithm: "brotliCompress",
        deleteOriginFile: VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE
      })
    );
  }
  return plugins;
};
var createVitePwa = (viteEnv) => {
  const { VITE_GLOB_APP_TITLE } = viteEnv;
  return VitePWA({
    registerType: "autoUpdate",
    manifest: {
      name: VITE_GLOB_APP_TITLE,
      short_name: VITE_GLOB_APP_TITLE,
      theme_color: "#ffffff",
      icons: [
        {
          src: "/logo.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/logo.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    }
  });
};

// package.json
var package_default = {
  name: "geeker-admin",
  private: true,
  version: "1.2.0",
  type: "module",
  description: "geeker-admin open source management system",
  author: {
    name: "Geeker",
    email: "848130454@qq.com",
    url: "https://github.com/HalseySpicy"
  },
  license: "MIT",
  homepage: "https://github.com/HalseySpicy/Geeker-Admin",
  repository: {
    type: "git",
    url: "git@github.com:HalseySpicy/Geeker-Admin.git"
  },
  bugs: {
    url: "https://github.com/HalseySpicy/Geeker-Admin/issues"
  },
  scripts: {
    dev: "vite",
    serve: "vite",
    build: "vite build --mode production",
    "build:dev": "vue-tsc && vite build --mode development",
    "build:test": "vue-tsc && vite build --mode test",
    "build:pro": "vue-tsc && vite build --mode production",
    "type:check": "vue-tsc --noEmit --skipLibCheck",
    preview: "pnpm build:dev && vite preview",
    "lint:eslint": "eslint --fix --ext .js,.ts,.vue ./src",
    "lint:prettier": 'prettier --write "src/**/*.{js,ts,json,tsx,css,less,scss,vue,html,md}"',
    "lint:stylelint": 'stylelint --cache --fix "**/*.{vue,less,postcss,css,scss}" --cache --cache-location node_modules/.cache/stylelint/',
    "lint:lint-staged": "lint-staged",
    prepare: "husky install",
    release: "standard-version",
    commit: "git add -A && czg && git push"
  },
  dependencies: {
    "@element-plus/icons-vue": "^2.3.1",
    "@vueuse/core": "^10.11.0",
    "@wangeditor/editor": "^5.1.23",
    "@wangeditor/editor-for-vue": "^5.1.12",
    axios: "^1.7.2",
    dayjs: "^1.11.11",
    "driver.js": "^1.3.1",
    echarts: "^5.5.1",
    "echarts-liquidfill": "^3.1.0",
    "element-plus": "^2.7.6",
    md5: "^2.3.0",
    mitt: "^3.0.1",
    nprogress: "^0.2.0",
    pinia: "^2.1.7",
    "pinia-plugin-persistedstate": "^3.2.1",
    qs: "^6.12.1",
    screenfull: "^6.0.2",
    sortablejs: "^1.15.2",
    vue: "^3.4.31",
    "vue-i18n": "^9.13.1",
    "vue-router": "^4.4.0",
    vuedraggable: "^4.1.0"
  },
  devDependencies: {
    "@commitlint/cli": "^18.4.3",
    "@commitlint/config-conventional": "^18.4.3",
    "@types/md5": "^2.3.5",
    "@types/nprogress": "^0.2.3",
    "@types/qs": "^6.9.15",
    "@types/sortablejs": "^1.15.8",
    "@typescript-eslint/eslint-plugin": "^7.14.1",
    "@typescript-eslint/parser": "^7.14.1",
    "@vitejs/plugin-vue": "^5.0.4",
    "@vitejs/plugin-vue-jsx": "^3.1.0",
    autoprefixer: "^10.4.19",
    "code-inspector-plugin": "^0.16.1",
    "cz-git": "1.9.2",
    czg: "^1.9.2",
    eslint: "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-vue": "^9.26.0",
    husky: "^9.0.11",
    "lint-staged": "^15.2.5",
    postcss: "^8.4.38",
    "postcss-html": "^1.7.0",
    prettier: "^3.3.2",
    "rollup-plugin-visualizer": "^5.12.0",
    sass: "^1.77.6",
    "standard-version": "^9.5.0",
    stylelint: "^16.6.1",
    "stylelint-config-html": "^1.1.0",
    "stylelint-config-recess-order": "^5.0.1",
    "stylelint-config-recommended-scss": "^14.0.0",
    "stylelint-config-recommended-vue": "^1.5.0",
    "stylelint-config-standard": "^36.0.0",
    "stylelint-config-standard-scss": "^13.1.0",
    typescript: "^5.5.2",
    "unplugin-vue-setup-extend-plus": "^1.0.1",
    vite: "^5.3.2",
    "vite-plugin-compression": "^0.5.1",
    "vite-plugin-eslint": "^1.8.1",
    "vite-plugin-html": "^3.2.2",
    "vite-plugin-pwa": "^0.20.0",
    "vite-plugin-svg-icons": "^2.0.1",
    "vite-plugin-vue-devtools": "^7.3.5",
    "vue-tsc": "^2.0.22"
  },
  engines: {
    node: ">=16.18.0"
  },
  browserslist: {
    production: [
      "> 1%",
      "not dead",
      "not op_mini all"
    ],
    development: [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  config: {
    commitizen: {
      path: "node_modules/cz-git"
    }
  }
};

// vite.config.ts
import dayjs from "file:///D:/phpstudy_pro/WWW/xm/cloak/admin/node_modules/dayjs/dayjs.min.js";
var __vite_injected_original_dirname = "D:\\phpstudy_pro\\WWW\\xm\\cloak\\admin";
var { dependencies, devDependencies, name, version } = package_default;
var __APP_INFO__ = {
  pkg: { dependencies, devDependencies, name, version },
  lastBuildTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
};
var vite_config_default = defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = wrapperEnv(env);
  return {
    base: viteEnv.VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias: {
        "@": resolve2(__vite_injected_original_dirname, "./src"),
        "vue-i18n": "vue-i18n/dist/vue-i18n.cjs.js"
      }
    },
    define: {
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/var.scss" as *;`
        }
      }
    },
    server: {
      host: "0.0.0.0",
      port: viteEnv.VITE_PORT,
      open: viteEnv.VITE_OPEN,
      cors: true,
      // Load proxy configuration from .env.development
      proxy: createProxy(viteEnv.VITE_PROXY)
    },
    plugins: createVitePlugins(viteEnv),
    esbuild: {
      pure: viteEnv.VITE_DROP_CONSOLE ? ["console.log", "debugger"] : []
    },
    build: {
      outDir: "dist",
      minify: "esbuild",
      // esbuild 打包更快，但是不能去除 console.log，terser打包慢，但能去除 console.log
      // minify: "terser",
      // terserOptions: {
      // 	compress: {
      // 		drop_console: viteEnv.VITE_DROP_CONSOLE,
      // 		drop_debugger: true
      // 	}
      // },
      sourcemap: false,
      // 禁用 gzip 压缩大小报告，可略微减少打包时间
      reportCompressedSize: false,
      // 规定触发警告的 chunk 大小
      chunkSizeWarningLimit: 2e3,
      rollupOptions: {
        output: {
          // Static resource classification and packaging
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiYnVpbGQvZ2V0RW52LnRzIiwgImJ1aWxkL3Byb3h5LnRzIiwgImJ1aWxkL3BsdWdpbnMudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxccGhwc3R1ZHlfcHJvXFxcXFdXV1xcXFx4bVxcXFxjbG9ha1xcXFxhZG1pblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccGhwc3R1ZHlfcHJvXFxcXFdXV1xcXFx4bVxcXFxjbG9ha1xcXFxhZG1pblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovcGhwc3R1ZHlfcHJvL1dXVy94bS9jbG9hay9hZG1pbi92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiwgQ29uZmlnRW52LCBVc2VyQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IHdyYXBwZXJFbnYgfSBmcm9tIFwiLi9idWlsZC9nZXRFbnZcIjtcclxuaW1wb3J0IHsgY3JlYXRlUHJveHkgfSBmcm9tIFwiLi9idWlsZC9wcm94eVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVWaXRlUGx1Z2lucyB9IGZyb20gXCIuL2J1aWxkL3BsdWdpbnNcIjtcclxuaW1wb3J0IHBrZyBmcm9tIFwiLi9wYWNrYWdlLmpzb25cIjtcclxuaW1wb3J0IGRheWpzIGZyb20gXCJkYXlqc1wiO1xyXG5cclxuY29uc3QgeyBkZXBlbmRlbmNpZXMsIGRldkRlcGVuZGVuY2llcywgbmFtZSwgdmVyc2lvbiB9ID0gcGtnO1xyXG5jb25zdCBfX0FQUF9JTkZPX18gPSB7XHJcbiAgcGtnOiB7IGRlcGVuZGVuY2llcywgZGV2RGVwZW5kZW5jaWVzLCBuYW1lLCB2ZXJzaW9uIH0sXHJcbiAgbGFzdEJ1aWxkVGltZTogZGF5anMoKS5mb3JtYXQoXCJZWVlZLU1NLUREIEhIOm1tOnNzXCIpXHJcbn07XHJcblxyXG4vLyBAc2VlOiBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9OiBDb25maWdFbnYpOiBVc2VyQ29uZmlnID0+IHtcclxuICBjb25zdCByb290ID0gcHJvY2Vzcy5jd2QoKTtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHJvb3QpO1xyXG4gIGNvbnN0IHZpdGVFbnYgPSB3cmFwcGVyRW52KGVudik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBiYXNlOiB2aXRlRW52LlZJVEVfUFVCTElDX1BBVEgsXHJcbiAgICByb290LFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgICBcInZ1ZS1pMThuXCI6IFwidnVlLWkxOG4vZGlzdC92dWUtaTE4bi5janMuanNcIlxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgIF9fQVBQX0lORk9fXzogSlNPTi5zdHJpbmdpZnkoX19BUFBfSU5GT19fKVxyXG4gICAgfSxcclxuICAgIGNzczoge1xyXG4gICAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XHJcbiAgICAgICAgc2Nzczoge1xyXG4gICAgICAgICAgYWRkaXRpb25hbERhdGE6IGBAdXNlIFwiQC9zdHlsZXMvdmFyLnNjc3NcIiBhcyAqO2BcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogXCIwLjAuMC4wXCIsXHJcbiAgICAgIHBvcnQ6IHZpdGVFbnYuVklURV9QT1JULFxyXG4gICAgICBvcGVuOiB2aXRlRW52LlZJVEVfT1BFTixcclxuICAgICAgY29yczogdHJ1ZSxcclxuICAgICAgLy8gTG9hZCBwcm94eSBjb25maWd1cmF0aW9uIGZyb20gLmVudi5kZXZlbG9wbWVudFxyXG4gICAgICBwcm94eTogY3JlYXRlUHJveHkodml0ZUVudi5WSVRFX1BST1hZKVxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IGNyZWF0ZVZpdGVQbHVnaW5zKHZpdGVFbnYpLFxyXG4gICAgZXNidWlsZDoge1xyXG4gICAgICBwdXJlOiB2aXRlRW52LlZJVEVfRFJPUF9DT05TT0xFID8gW1wiY29uc29sZS5sb2dcIiwgXCJkZWJ1Z2dlclwiXSA6IFtdXHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgb3V0RGlyOiBcImRpc3RcIixcclxuICAgICAgbWluaWZ5OiBcImVzYnVpbGRcIixcclxuICAgICAgLy8gZXNidWlsZCBcdTYyNTNcdTUzMDVcdTY2RjRcdTVGRUJcdUZGMENcdTRGNDZcdTY2MkZcdTRFMERcdTgwRkRcdTUzQkJcdTk2NjQgY29uc29sZS5sb2dcdUZGMEN0ZXJzZXJcdTYyNTNcdTUzMDVcdTYxNjJcdUZGMENcdTRGNDZcdTgwRkRcdTUzQkJcdTk2NjQgY29uc29sZS5sb2dcclxuICAgICAgLy8gbWluaWZ5OiBcInRlcnNlclwiLFxyXG4gICAgICAvLyB0ZXJzZXJPcHRpb25zOiB7XHJcbiAgICAgIC8vIFx0Y29tcHJlc3M6IHtcclxuICAgICAgLy8gXHRcdGRyb3BfY29uc29sZTogdml0ZUVudi5WSVRFX0RST1BfQ09OU09MRSxcclxuICAgICAgLy8gXHRcdGRyb3BfZGVidWdnZXI6IHRydWVcclxuICAgICAgLy8gXHR9XHJcbiAgICAgIC8vIH0sXHJcbiAgICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgICAgIC8vIFx1Nzk4MVx1NzUyOCBnemlwIFx1NTM4Qlx1N0YyOVx1NTkyN1x1NUMwRlx1NjJBNVx1NTQ0QVx1RkYwQ1x1NTNFRlx1NzU2NVx1NUZBRVx1NTFDRlx1NUMxMVx1NjI1M1x1NTMwNVx1NjVGNlx1OTVGNFxyXG4gICAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXHJcbiAgICAgIC8vIFx1ODlDNFx1NUI5QVx1ODlFNlx1NTNEMVx1OEI2Nlx1NTQ0QVx1NzY4NCBjaHVuayBcdTU5MjdcdTVDMEZcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAyMDAwLFxyXG4gICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICAvLyBTdGF0aWMgcmVzb3VyY2UgY2xhc3NpZmljYXRpb24gYW5kIHBhY2thZ2luZ1xyXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6IFwiYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanNcIixcclxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcImFzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzXCIsXHJcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogXCJhc3NldHMvW2V4dF0vW25hbWVdLVtoYXNoXS5bZXh0XVwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxccGhwc3R1ZHlfcHJvXFxcXFdXV1xcXFx4bVxcXFxjbG9ha1xcXFxhZG1pblxcXFxidWlsZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccGhwc3R1ZHlfcHJvXFxcXFdXV1xcXFx4bVxcXFxjbG9ha1xcXFxhZG1pblxcXFxidWlsZFxcXFxnZXRFbnYudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3BocHN0dWR5X3Byby9XV1cveG0vY2xvYWsvYWRtaW4vYnVpbGQvZ2V0RW52LnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHR5cGUgeyBWaXRlRW52IH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0RldkZuKG1vZGU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBtb2RlID09PSBcImRldmVsb3BtZW50XCI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1Byb2RGbihtb2RlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICByZXR1cm4gbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1Rlc3RGbihtb2RlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICByZXR1cm4gbW9kZSA9PT0gXCJ0ZXN0XCI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRvIGdlbmVyYXRlIHBhY2thZ2UgcHJldmlld1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVwb3J0TW9kZSgpOiBib29sZWFuIHtcclxuICByZXR1cm4gcHJvY2Vzcy5lbnYuVklURV9SRVBPUlQgPT09IFwidHJ1ZVwiO1xyXG59XHJcblxyXG4vLyBSZWFkIGFsbCBlbnZpcm9ubWVudCB2YXJpYWJsZSBjb25maWd1cmF0aW9uIGZpbGVzIHRvIHByb2Nlc3MuZW52XHJcbmV4cG9ydCBmdW5jdGlvbiB3cmFwcGVyRW52KGVudkNvbmY6IFJlY29yZGFibGUpOiBWaXRlRW52IHtcclxuICBjb25zdCByZXQ6IGFueSA9IHt9O1xyXG5cclxuICBmb3IgKGNvbnN0IGVudk5hbWUgb2YgT2JqZWN0LmtleXMoZW52Q29uZikpIHtcclxuICAgIGxldCByZWFsTmFtZSA9IGVudkNvbmZbZW52TmFtZV0ucmVwbGFjZSgvXFxcXG4vZywgXCJcXG5cIik7XHJcbiAgICByZWFsTmFtZSA9IHJlYWxOYW1lID09PSBcInRydWVcIiA/IHRydWUgOiByZWFsTmFtZSA9PT0gXCJmYWxzZVwiID8gZmFsc2UgOiByZWFsTmFtZTtcclxuICAgIGlmIChlbnZOYW1lID09PSBcIlZJVEVfUE9SVFwiKSByZWFsTmFtZSA9IE51bWJlcihyZWFsTmFtZSk7XHJcbiAgICBpZiAoZW52TmFtZSA9PT0gXCJWSVRFX1BST1hZXCIpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICByZWFsTmFtZSA9IEpTT04ucGFyc2UocmVhbE5hbWUpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHJlYWxOYW1lID0gW107XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldFtlbnZOYW1lXSA9IHJlYWxOYW1lO1xyXG4gIH1cclxuICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IHVzZXIgcm9vdCBkaXJlY3RvcnlcclxuICogQHBhcmFtIGRpciBmaWxlIHBhdGhcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290UGF0aCguLi5kaXI6IHN0cmluZ1tdKSB7XHJcbiAgcmV0dXJuIHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAuLi5kaXIpO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxccGhwc3R1ZHlfcHJvXFxcXFdXV1xcXFx4bVxcXFxjbG9ha1xcXFxhZG1pblxcXFxidWlsZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccGhwc3R1ZHlfcHJvXFxcXFdXV1xcXFx4bVxcXFxjbG9ha1xcXFxhZG1pblxcXFxidWlsZFxcXFxwcm94eS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovcGhwc3R1ZHlfcHJvL1dXVy94bS9jbG9hay9hZG1pbi9idWlsZC9wcm94eS50c1wiO2ltcG9ydCB0eXBlIHsgUHJveHlPcHRpb25zIH0gZnJvbSBcInZpdGVcIjtcclxuXHJcbnR5cGUgUHJveHlJdGVtID0gW3N0cmluZywgc3RyaW5nXTtcclxuXHJcbnR5cGUgUHJveHlMaXN0ID0gUHJveHlJdGVtW107XHJcblxyXG50eXBlIFByb3h5VGFyZ2V0TGlzdCA9IFJlY29yZDxzdHJpbmcsIFByb3h5T3B0aW9ucz47XHJcblxyXG4vKipcclxuICogXHU1MjFCXHU1RUZBXHU0RUUzXHU3NDA2XHVGRjBDXHU3NTI4XHU0RThFXHU4OUUzXHU2NzkwIC5lbnYuZGV2ZWxvcG1lbnQgXHU0RUUzXHU3NDA2XHU5MTREXHU3RjZFXHJcbiAqIEBwYXJhbSBsaXN0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJveHkobGlzdDogUHJveHlMaXN0ID0gW10pIHtcclxuICBjb25zdCByZXQ6IFByb3h5VGFyZ2V0TGlzdCA9IHt9O1xyXG4gIGZvciAoY29uc3QgW3ByZWZpeCwgdGFyZ2V0XSBvZiBsaXN0KSB7XHJcbiAgICBjb25zdCBodHRwc1JFID0gL15odHRwczpcXC9cXC8vO1xyXG4gICAgY29uc3QgaXNIdHRwcyA9IGh0dHBzUkUudGVzdCh0YXJnZXQpO1xyXG5cclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9odHRwLXBhcnR5L25vZGUtaHR0cC1wcm94eSNvcHRpb25zXHJcbiAgICByZXRbcHJlZml4XSA9IHtcclxuICAgICAgdGFyZ2V0OiB0YXJnZXQsXHJcbiAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgd3M6IHRydWUsXHJcbiAgICAgIHJld3JpdGU6IHBhdGggPT4gcGF0aC5yZXBsYWNlKG5ldyBSZWdFeHAoYF4ke3ByZWZpeH1gKSwgXCJcIiksXHJcbiAgICAgIC8vIGh0dHBzIGlzIHJlcXVpcmUgc2VjdXJlPWZhbHNlXHJcbiAgICAgIC4uLihpc0h0dHBzID8geyBzZWN1cmU6IGZhbHNlIH0gOiB7fSlcclxuICAgIH07XHJcbiAgfVxyXG4gIHJldHVybiByZXQ7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwaHBzdHVkeV9wcm9cXFxcV1dXXFxcXHhtXFxcXGNsb2FrXFxcXGFkbWluXFxcXGJ1aWxkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxwaHBzdHVkeV9wcm9cXFxcV1dXXFxcXHhtXFxcXGNsb2FrXFxcXGFkbWluXFxcXGJ1aWxkXFxcXHBsdWdpbnMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3BocHN0dWR5X3Byby9XV1cveG0vY2xvYWsvYWRtaW4vYnVpbGQvcGx1Z2lucy50c1wiO2ltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBQbHVnaW5PcHRpb24gfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVIdG1sUGx1Z2luIH0gZnJvbSBcInZpdGUtcGx1Z2luLWh0bWxcIjtcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcclxuaW1wb3J0IHsgY3JlYXRlU3ZnSWNvbnNQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4tc3ZnLWljb25zXCI7XHJcbmltcG9ydCB2dWUgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXZ1ZVwiO1xyXG5pbXBvcnQgdnVlSnN4IGZyb20gXCJAdml0ZWpzL3BsdWdpbi12dWUtanN4XCI7XHJcbmltcG9ydCBlc2xpbnRQbHVnaW4gZnJvbSBcInZpdGUtcGx1Z2luLWVzbGludFwiO1xyXG5pbXBvcnQgdml0ZUNvbXByZXNzaW9uIGZyb20gXCJ2aXRlLXBsdWdpbi1jb21wcmVzc2lvblwiO1xyXG5pbXBvcnQgdnVlU2V0dXBFeHRlbmQgZnJvbSBcInVucGx1Z2luLXZ1ZS1zZXR1cC1leHRlbmQtcGx1cy92aXRlXCI7XHJcbmltcG9ydCBOZXh0RGV2VG9vbHMgZnJvbSBcInZpdGUtcGx1Z2luLXZ1ZS1kZXZ0b29sc1wiO1xyXG5pbXBvcnQgeyBjb2RlSW5zcGVjdG9yUGx1Z2luIH0gZnJvbSBcImNvZGUtaW5zcGVjdG9yLXBsdWdpblwiO1xyXG5pbXBvcnQgdHlwZSB7IFZpdGVFbnYgfSBmcm9tIFwiLi90eXBlc1wiO1xyXG5cclxuLyoqXHJcbiAqIFx1NTIxQlx1NUVGQSB2aXRlIFx1NjNEMlx1NEVGNlxyXG4gKiBAcGFyYW0gdml0ZUVudlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGNyZWF0ZVZpdGVQbHVnaW5zID0gKHZpdGVFbnY6IFZpdGVFbnYpOiAoUGx1Z2luT3B0aW9uIHwgUGx1Z2luT3B0aW9uW10pW10gPT4ge1xyXG4gIGNvbnN0IHsgVklURV9HTE9CX0FQUF9USVRMRSwgVklURV9SRVBPUlQsIFZJVEVfREVWVE9PTFMsIFZJVEVfUFdBLCBWSVRFX0NPREVJTlNQRUNUT1IgfSA9IHZpdGVFbnY7XHJcbiAgcmV0dXJuIFtcclxuICAgIHZ1ZSgpLFxyXG4gICAgLy8gdnVlIFx1NTNFRlx1NEVFNVx1NEY3Rlx1NzUyOCBqc3gvdHN4IFx1OEJFRFx1NkNENVxyXG4gICAgdnVlSnN4KCksXHJcbiAgICAvLyBkZXZUb29sc1xyXG4gICAgVklURV9ERVZUT09MUyAmJiBOZXh0RGV2VG9vbHMoeyBsYXVuY2hFZGl0b3I6IFwiY29kZVwiIH0pLFxyXG4gICAgLy8gZXNMaW50IFx1NjJBNVx1OTUxOVx1NEZFMVx1NjA2Rlx1NjYzRVx1NzkzQVx1NTcyOFx1NkQ0Rlx1ODlDOFx1NTY2OFx1NzU0Q1x1OTc2Mlx1NEUwQVxyXG4gICAgZXNsaW50UGx1Z2luKCksXHJcbiAgICAvLyBuYW1lIFx1NTNFRlx1NEVFNVx1NTE5OVx1NTcyOCBzY3JpcHQgXHU2ODA3XHU3QjdFXHU0RTBBXHJcbiAgICB2dWVTZXR1cEV4dGVuZCh7fSksXHJcbiAgICAvLyBcdTUyMUJcdTVFRkFcdTYyNTNcdTUzMDVcdTUzOEJcdTdGMjlcdTkxNERcdTdGNkVcclxuICAgIGNyZWF0ZUNvbXByZXNzaW9uKHZpdGVFbnYpLFxyXG4gICAgLy8gXHU2Q0U4XHU1MTY1XHU1M0Q4XHU5MUNGXHU1MjMwIGh0bWwgXHU2NTg3XHU0RUY2XHJcbiAgICBjcmVhdGVIdG1sUGx1Z2luKHtcclxuICAgICAgbWluaWZ5OiB0cnVlLFxyXG4gICAgICBpbmplY3Q6IHtcclxuICAgICAgICBkYXRhOiB7IHRpdGxlOiBWSVRFX0dMT0JfQVBQX1RJVExFIH1cclxuICAgICAgfVxyXG4gICAgfSksXHJcbiAgICAvLyBcdTRGN0ZcdTc1Mjggc3ZnIFx1NTZGRVx1NjgwN1xyXG4gICAgY3JlYXRlU3ZnSWNvbnNQbHVnaW4oe1xyXG4gICAgICBpY29uRGlyczogW3Jlc29sdmUocHJvY2Vzcy5jd2QoKSwgXCJzcmMvYXNzZXRzL2ljb25zXCIpXSxcclxuICAgICAgc3ltYm9sSWQ6IFwiaWNvbi1bZGlyXS1bbmFtZV1cIlxyXG4gICAgfSksXHJcbiAgICAvLyB2aXRlUFdBXHJcbiAgICBWSVRFX1BXQSAmJiBjcmVhdGVWaXRlUHdhKHZpdGVFbnYpLFxyXG4gICAgLy8gXHU2NjJGXHU1NDI2XHU3NTFGXHU2MjEwXHU1MzA1XHU5ODg0XHU4OUM4XHVGRjBDXHU1MjA2XHU2NzkwXHU0RjlEXHU4RDU2XHU1MzA1XHU1OTI3XHU1QzBGXHU1MDVBXHU0RjE4XHU1MzE2XHU1OTA0XHU3NDA2XHJcbiAgICBWSVRFX1JFUE9SVCAmJiAodmlzdWFsaXplcih7IGZpbGVuYW1lOiBcInN0YXRzLmh0bWxcIiwgZ3ppcFNpemU6IHRydWUsIGJyb3RsaVNpemU6IHRydWUgfSkgYXMgUGx1Z2luT3B0aW9uKSxcclxuICAgIC8vIFx1ODFFQVx1NTJBOCBJREUgXHU1RTc2XHU1QzA2XHU1MTQ5XHU2ODA3XHU1QjlBXHU0RjREXHU1MjMwIERPTSBcdTVCRjlcdTVFOTRcdTc2ODRcdTZFOTBcdTRFRTNcdTc4MDFcdTRGNERcdTdGNkVcdTMwMDJzZWU6IGh0dHBzOi8vaW5zcGVjdG9yLmZlLWRldi5jbi9ndWlkZS9zdGFydC5odG1sXHJcbiAgICBWSVRFX0NPREVJTlNQRUNUT1IgJiZcclxuICAgICAgY29kZUluc3BlY3RvclBsdWdpbih7XHJcbiAgICAgICAgYnVuZGxlcjogXCJ2aXRlXCJcclxuICAgICAgfSlcclxuICBdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBkZXNjcmlwdGlvbiBcdTY4MzlcdTYzNkUgY29tcHJlc3MgXHU5MTREXHU3RjZFXHVGRjBDXHU3NTFGXHU2MjEwXHU0RTBEXHU1NDBDXHU3Njg0XHU1MzhCXHU3RjI5XHU4OUM0XHU1MjE5XHJcbiAqIEBwYXJhbSB2aXRlRW52XHJcbiAqL1xyXG5jb25zdCBjcmVhdGVDb21wcmVzc2lvbiA9ICh2aXRlRW52OiBWaXRlRW52KTogUGx1Z2luT3B0aW9uIHwgUGx1Z2luT3B0aW9uW10gPT4ge1xyXG4gIGNvbnN0IHsgVklURV9CVUlMRF9DT01QUkVTUyA9IFwibm9uZVwiLCBWSVRFX0JVSUxEX0NPTVBSRVNTX0RFTEVURV9PUklHSU5fRklMRSB9ID0gdml0ZUVudjtcclxuICBjb25zdCBjb21wcmVzc0xpc3QgPSBWSVRFX0JVSUxEX0NPTVBSRVNTLnNwbGl0KFwiLFwiKTtcclxuICBjb25zdCBwbHVnaW5zOiBQbHVnaW5PcHRpb25bXSA9IFtdO1xyXG4gIGlmIChjb21wcmVzc0xpc3QuaW5jbHVkZXMoXCJnemlwXCIpKSB7XHJcbiAgICBwbHVnaW5zLnB1c2goXHJcbiAgICAgIHZpdGVDb21wcmVzc2lvbih7XHJcbiAgICAgICAgZXh0OiBcIi5nelwiLFxyXG4gICAgICAgIGFsZ29yaXRobTogXCJnemlwXCIsXHJcbiAgICAgICAgZGVsZXRlT3JpZ2luRmlsZTogVklURV9CVUlMRF9DT01QUkVTU19ERUxFVEVfT1JJR0lOX0ZJTEVcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChjb21wcmVzc0xpc3QuaW5jbHVkZXMoXCJicm90bGlcIikpIHtcclxuICAgIHBsdWdpbnMucHVzaChcclxuICAgICAgdml0ZUNvbXByZXNzaW9uKHtcclxuICAgICAgICBleHQ6IFwiLmJyXCIsXHJcbiAgICAgICAgYWxnb3JpdGhtOiBcImJyb3RsaUNvbXByZXNzXCIsXHJcbiAgICAgICAgZGVsZXRlT3JpZ2luRmlsZTogVklURV9CVUlMRF9DT01QUkVTU19ERUxFVEVfT1JJR0lOX0ZJTEVcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG4gIHJldHVybiBwbHVnaW5zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBkZXNjcmlwdGlvbiBWaXRlUHdhXHJcbiAqIEBwYXJhbSB2aXRlRW52XHJcbiAqL1xyXG5jb25zdCBjcmVhdGVWaXRlUHdhID0gKHZpdGVFbnY6IFZpdGVFbnYpOiBQbHVnaW5PcHRpb24gfCBQbHVnaW5PcHRpb25bXSA9PiB7XHJcbiAgY29uc3QgeyBWSVRFX0dMT0JfQVBQX1RJVExFIH0gPSB2aXRlRW52O1xyXG4gIHJldHVybiBWaXRlUFdBKHtcclxuICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXHJcbiAgICBtYW5pZmVzdDoge1xyXG4gICAgICBuYW1lOiBWSVRFX0dMT0JfQVBQX1RJVExFLFxyXG4gICAgICBzaG9ydF9uYW1lOiBWSVRFX0dMT0JfQVBQX1RJVExFLFxyXG4gICAgICB0aGVtZV9jb2xvcjogXCIjZmZmZmZmXCIsXHJcbiAgICAgIGljb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3JjOiBcIi9sb2dvLnBuZ1wiLFxyXG4gICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3JjOiBcIi9sb2dvLnBuZ1wiLFxyXG4gICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3JjOiBcIi9sb2dvLnBuZ1wiLFxyXG4gICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgIHB1cnBvc2U6IFwiYW55IG1hc2thYmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH1cclxuICB9KTtcclxufTtcclxuIiwgIntcbiAgXCJuYW1lXCI6IFwiZ2Vla2VyLWFkbWluXCIsXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxuICBcInZlcnNpb25cIjogXCIxLjIuMFwiLFxuICBcInR5cGVcIjogXCJtb2R1bGVcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcImdlZWtlci1hZG1pbiBvcGVuIHNvdXJjZSBtYW5hZ2VtZW50IHN5c3RlbVwiLFxuICBcImF1dGhvclwiOiB7XG4gICAgXCJuYW1lXCI6IFwiR2Vla2VyXCIsXG4gICAgXCJlbWFpbFwiOiBcIjg0ODEzMDQ1NEBxcS5jb21cIixcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9IYWxzZXlTcGljeVwiXG4gIH0sXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcImhvbWVwYWdlXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL0hhbHNleVNwaWN5L0dlZWtlci1BZG1pblwiLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiZ2l0QGdpdGh1Yi5jb206SGFsc2V5U3BpY3kvR2Vla2VyLUFkbWluLmdpdFwiXG4gIH0sXG4gIFwiYnVnc1wiOiB7XG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vSGFsc2V5U3BpY3kvR2Vla2VyLUFkbWluL2lzc3Vlc1wiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXG4gICAgXCJzZXJ2ZVwiOiBcInZpdGVcIixcbiAgICBcImJ1aWxkXCI6IFwidml0ZSBidWlsZCAtLW1vZGUgcHJvZHVjdGlvblwiLFxuICAgIFwiYnVpbGQ6ZGV2XCI6IFwidnVlLXRzYyAmJiB2aXRlIGJ1aWxkIC0tbW9kZSBkZXZlbG9wbWVudFwiLFxuICAgIFwiYnVpbGQ6dGVzdFwiOiBcInZ1ZS10c2MgJiYgdml0ZSBidWlsZCAtLW1vZGUgdGVzdFwiLFxuICAgIFwiYnVpbGQ6cHJvXCI6IFwidnVlLXRzYyAmJiB2aXRlIGJ1aWxkIC0tbW9kZSBwcm9kdWN0aW9uXCIsXG4gICAgXCJ0eXBlOmNoZWNrXCI6IFwidnVlLXRzYyAtLW5vRW1pdCAtLXNraXBMaWJDaGVja1wiLFxuICAgIFwicHJldmlld1wiOiBcInBucG0gYnVpbGQ6ZGV2ICYmIHZpdGUgcHJldmlld1wiLFxuICAgIFwibGludDplc2xpbnRcIjogXCJlc2xpbnQgLS1maXggLS1leHQgLmpzLC50cywudnVlIC4vc3JjXCIsXG4gICAgXCJsaW50OnByZXR0aWVyXCI6IFwicHJldHRpZXIgLS13cml0ZSBcXFwic3JjLyoqLyoue2pzLHRzLGpzb24sdHN4LGNzcyxsZXNzLHNjc3MsdnVlLGh0bWwsbWR9XFxcIlwiLFxuICAgIFwibGludDpzdHlsZWxpbnRcIjogXCJzdHlsZWxpbnQgLS1jYWNoZSAtLWZpeCBcXFwiKiovKi57dnVlLGxlc3MscG9zdGNzcyxjc3Msc2Nzc31cXFwiIC0tY2FjaGUgLS1jYWNoZS1sb2NhdGlvbiBub2RlX21vZHVsZXMvLmNhY2hlL3N0eWxlbGludC9cIixcbiAgICBcImxpbnQ6bGludC1zdGFnZWRcIjogXCJsaW50LXN0YWdlZFwiLFxuICAgIFwicHJlcGFyZVwiOiBcImh1c2t5IGluc3RhbGxcIixcbiAgICBcInJlbGVhc2VcIjogXCJzdGFuZGFyZC12ZXJzaW9uXCIsXG4gICAgXCJjb21taXRcIjogXCJnaXQgYWRkIC1BICYmIGN6ZyAmJiBnaXQgcHVzaFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBlbGVtZW50LXBsdXMvaWNvbnMtdnVlXCI6IFwiXjIuMy4xXCIsXG4gICAgXCJAdnVldXNlL2NvcmVcIjogXCJeMTAuMTEuMFwiLFxuICAgIFwiQHdhbmdlZGl0b3IvZWRpdG9yXCI6IFwiXjUuMS4yM1wiLFxuICAgIFwiQHdhbmdlZGl0b3IvZWRpdG9yLWZvci12dWVcIjogXCJeNS4xLjEyXCIsXG4gICAgXCJheGlvc1wiOiBcIl4xLjcuMlwiLFxuICAgIFwiZGF5anNcIjogXCJeMS4xMS4xMVwiLFxuICAgIFwiZHJpdmVyLmpzXCI6IFwiXjEuMy4xXCIsXG4gICAgXCJlY2hhcnRzXCI6IFwiXjUuNS4xXCIsXG4gICAgXCJlY2hhcnRzLWxpcXVpZGZpbGxcIjogXCJeMy4xLjBcIixcbiAgICBcImVsZW1lbnQtcGx1c1wiOiBcIl4yLjcuNlwiLFxuICAgIFwibWQ1XCI6IFwiXjIuMy4wXCIsXG4gICAgXCJtaXR0XCI6IFwiXjMuMC4xXCIsXG4gICAgXCJucHJvZ3Jlc3NcIjogXCJeMC4yLjBcIixcbiAgICBcInBpbmlhXCI6IFwiXjIuMS43XCIsXG4gICAgXCJwaW5pYS1wbHVnaW4tcGVyc2lzdGVkc3RhdGVcIjogXCJeMy4yLjFcIixcbiAgICBcInFzXCI6IFwiXjYuMTIuMVwiLFxuICAgIFwic2NyZWVuZnVsbFwiOiBcIl42LjAuMlwiLFxuICAgIFwic29ydGFibGVqc1wiOiBcIl4xLjE1LjJcIixcbiAgICBcInZ1ZVwiOiBcIl4zLjQuMzFcIixcbiAgICBcInZ1ZS1pMThuXCI6IFwiXjkuMTMuMVwiLFxuICAgIFwidnVlLXJvdXRlclwiOiBcIl40LjQuMFwiLFxuICAgIFwidnVlZHJhZ2dhYmxlXCI6IFwiXjQuMS4wXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGNvbW1pdGxpbnQvY2xpXCI6IFwiXjE4LjQuM1wiLFxuICAgIFwiQGNvbW1pdGxpbnQvY29uZmlnLWNvbnZlbnRpb25hbFwiOiBcIl4xOC40LjNcIixcbiAgICBcIkB0eXBlcy9tZDVcIjogXCJeMi4zLjVcIixcbiAgICBcIkB0eXBlcy9ucHJvZ3Jlc3NcIjogXCJeMC4yLjNcIixcbiAgICBcIkB0eXBlcy9xc1wiOiBcIl42LjkuMTVcIixcbiAgICBcIkB0eXBlcy9zb3J0YWJsZWpzXCI6IFwiXjEuMTUuOFwiLFxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCJeNy4xNC4xXCIsXG4gICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvcGFyc2VyXCI6IFwiXjcuMTQuMVwiLFxuICAgIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI6IFwiXjUuMC40XCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi12dWUtanN4XCI6IFwiXjMuMS4wXCIsXG4gICAgXCJhdXRvcHJlZml4ZXJcIjogXCJeMTAuNC4xOVwiLFxuICAgIFwiY29kZS1pbnNwZWN0b3ItcGx1Z2luXCI6IFwiXjAuMTYuMVwiLFxuICAgIFwiY3otZ2l0XCI6IFwiMS45LjJcIixcbiAgICBcImN6Z1wiOiBcIl4xLjkuMlwiLFxuICAgIFwiZXNsaW50XCI6IFwiXjguNTcuMFwiLFxuICAgIFwiZXNsaW50LWNvbmZpZy1wcmV0dGllclwiOiBcIl45LjEuMFwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1wcmV0dGllclwiOiBcIl41LjEuM1wiLFxuICAgIFwiZXNsaW50LXBsdWdpbi12dWVcIjogXCJeOS4yNi4wXCIsXG4gICAgXCJodXNreVwiOiBcIl45LjAuMTFcIixcbiAgICBcImxpbnQtc3RhZ2VkXCI6IFwiXjE1LjIuNVwiLFxuICAgIFwicG9zdGNzc1wiOiBcIl44LjQuMzhcIixcbiAgICBcInBvc3Rjc3MtaHRtbFwiOiBcIl4xLjcuMFwiLFxuICAgIFwicHJldHRpZXJcIjogXCJeMy4zLjJcIixcbiAgICBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiOiBcIl41LjEyLjBcIixcbiAgICBcInNhc3NcIjogXCJeMS43Ny42XCIsXG4gICAgXCJzdGFuZGFyZC12ZXJzaW9uXCI6IFwiXjkuNS4wXCIsXG4gICAgXCJzdHlsZWxpbnRcIjogXCJeMTYuNi4xXCIsXG4gICAgXCJzdHlsZWxpbnQtY29uZmlnLWh0bWxcIjogXCJeMS4xLjBcIixcbiAgICBcInN0eWxlbGludC1jb25maWctcmVjZXNzLW9yZGVyXCI6IFwiXjUuMC4xXCIsXG4gICAgXCJzdHlsZWxpbnQtY29uZmlnLXJlY29tbWVuZGVkLXNjc3NcIjogXCJeMTQuMC4wXCIsXG4gICAgXCJzdHlsZWxpbnQtY29uZmlnLXJlY29tbWVuZGVkLXZ1ZVwiOiBcIl4xLjUuMFwiLFxuICAgIFwic3R5bGVsaW50LWNvbmZpZy1zdGFuZGFyZFwiOiBcIl4zNi4wLjBcIixcbiAgICBcInN0eWxlbGludC1jb25maWctc3RhbmRhcmQtc2Nzc1wiOiBcIl4xMy4xLjBcIixcbiAgICBcInR5cGVzY3JpcHRcIjogXCJeNS41LjJcIixcbiAgICBcInVucGx1Z2luLXZ1ZS1zZXR1cC1leHRlbmQtcGx1c1wiOiBcIl4xLjAuMVwiLFxuICAgIFwidml0ZVwiOiBcIl41LjMuMlwiLFxuICAgIFwidml0ZS1wbHVnaW4tY29tcHJlc3Npb25cIjogXCJeMC41LjFcIixcbiAgICBcInZpdGUtcGx1Z2luLWVzbGludFwiOiBcIl4xLjguMVwiLFxuICAgIFwidml0ZS1wbHVnaW4taHRtbFwiOiBcIl4zLjIuMlwiLFxuICAgIFwidml0ZS1wbHVnaW4tcHdhXCI6IFwiXjAuMjAuMFwiLFxuICAgIFwidml0ZS1wbHVnaW4tc3ZnLWljb25zXCI6IFwiXjIuMC4xXCIsXG4gICAgXCJ2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHNcIjogXCJeNy4zLjVcIixcbiAgICBcInZ1ZS10c2NcIjogXCJeMi4wLjIyXCJcbiAgfSxcbiAgXCJlbmdpbmVzXCI6IHtcbiAgICBcIm5vZGVcIjogXCI+PTE2LjE4LjBcIlxuICB9LFxuICBcImJyb3dzZXJzbGlzdFwiOiB7XG4gICAgXCJwcm9kdWN0aW9uXCI6IFtcbiAgICAgIFwiPiAxJVwiLFxuICAgICAgXCJub3QgZGVhZFwiLFxuICAgICAgXCJub3Qgb3BfbWluaSBhbGxcIlxuICAgIF0sXG4gICAgXCJkZXZlbG9wbWVudFwiOiBbXG4gICAgICBcImxhc3QgMSBjaHJvbWUgdmVyc2lvblwiLFxuICAgICAgXCJsYXN0IDEgZmlyZWZveCB2ZXJzaW9uXCIsXG4gICAgICBcImxhc3QgMSBzYWZhcmkgdmVyc2lvblwiXG4gICAgXVxuICB9LFxuICBcImNvbmZpZ1wiOiB7XG4gICAgXCJjb21taXRpemVuXCI6IHtcbiAgICAgIFwicGF0aFwiOiBcIm5vZGVfbW9kdWxlcy9jei1naXRcIlxuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvUyxTQUFTLGNBQWMsZUFBc0M7QUFDalcsU0FBUyxXQUFBQSxnQkFBZTs7O0FDc0JqQixTQUFTLFdBQVcsU0FBOEI7QUFDdkQsUUFBTSxNQUFXLENBQUM7QUFFbEIsYUFBVyxXQUFXLE9BQU8sS0FBSyxPQUFPLEdBQUc7QUFDMUMsUUFBSSxXQUFXLFFBQVEsT0FBTyxFQUFFLFFBQVEsUUFBUSxJQUFJO0FBQ3BELGVBQVcsYUFBYSxTQUFTLE9BQU8sYUFBYSxVQUFVLFFBQVE7QUFDdkUsUUFBSSxZQUFZLFlBQWEsWUFBVyxPQUFPLFFBQVE7QUFDdkQsUUFBSSxZQUFZLGNBQWM7QUFDNUIsVUFBSTtBQUNGLG1CQUFXLEtBQUssTUFBTSxRQUFRO0FBQUEsTUFDaEMsU0FBUyxPQUFPO0FBQ2QsbUJBQVcsQ0FBQztBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQ0EsUUFBSSxPQUFPLElBQUk7QUFBQSxFQUNqQjtBQUNBLFNBQU87QUFDVDs7O0FDNUJPLFNBQVMsWUFBWSxPQUFrQixDQUFDLEdBQUc7QUFDaEQsUUFBTSxNQUF1QixDQUFDO0FBQzlCLGFBQVcsQ0FBQyxRQUFRLE1BQU0sS0FBSyxNQUFNO0FBQ25DLFVBQU0sVUFBVTtBQUNoQixVQUFNLFVBQVUsUUFBUSxLQUFLLE1BQU07QUFHbkMsUUFBSSxNQUFNLElBQUk7QUFBQSxNQUNaO0FBQUEsTUFDQSxjQUFjO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixTQUFTLFVBQVEsS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLE1BQU0sRUFBRSxHQUFHLEVBQUU7QUFBQTtBQUFBLE1BRTFELEdBQUksVUFBVSxFQUFFLFFBQVEsTUFBTSxJQUFJLENBQUM7QUFBQSxJQUNyQztBQUFBLEVBQ0Y7QUFDQSxTQUFPO0FBQ1Q7OztBQzdCZ1QsU0FBUyxlQUFlO0FBRXhVLFNBQVMsZUFBZTtBQUN4QixT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QVF6QyxJQUFNLEVBQUUsY0FBYyxpQkFBaUIsTUFBTSxRQUFRLElBQUk7QUFDekQsSUFBTSxlQUFlO0FBQUEsRUFDbkIsS0FBSyxFQUFFLGNBQWMsaUJBQWlCLE1BQU0sUUFBUTtBQUFBLEVBQ3BELGVBQWUsTUFBTSxFQUFFLE9BQU8scUJBQXFCO0FBQ3JEO0FBR0EsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQTZCO0FBQy9ELFFBQU0sT0FBTyxRQUFRLElBQUk7QUFDekIsUUFBTSxNQUFNLFFBQVEsTUFBTSxJQUFJO0FBQzlCLFFBQU0sVUFBVSxXQUFXLEdBQUc7QUFFOUIsU0FBTztBQUFBLElBQ0wsTUFBTSxRQUFRO0FBQUEsSUFDZDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBS0MsU0FBUSxrQ0FBVyxPQUFPO0FBQUEsUUFDL0IsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixjQUFjLEtBQUssVUFBVSxZQUFZO0FBQUEsSUFDM0M7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILHFCQUFxQjtBQUFBLFFBQ25CLE1BQU07QUFBQSxVQUNKLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU0sUUFBUTtBQUFBLE1BQ2QsTUFBTSxRQUFRO0FBQUEsTUFDZCxNQUFNO0FBQUE7QUFBQSxNQUVOLE9BQU8sWUFBWSxRQUFRLFVBQVU7QUFBQSxJQUN2QztBQUFBLElBQ0EsU0FBUyxrQkFBa0IsT0FBTztBQUFBLElBQ2xDLFNBQVM7QUFBQSxNQUNQLE1BQU0sUUFBUSxvQkFBb0IsQ0FBQyxlQUFlLFVBQVUsSUFBSSxDQUFDO0FBQUEsSUFDbkU7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFTUixXQUFXO0FBQUE7QUFBQSxNQUVYLHNCQUFzQjtBQUFBO0FBQUEsTUFFdEIsdUJBQXVCO0FBQUEsTUFDdkIsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBO0FBQUEsVUFFTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInJlc29sdmUiLCAicmVzb2x2ZSJdCn0K
