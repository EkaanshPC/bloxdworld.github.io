const esbuild = require("esbuild");
const csso = require("csso");
const { minify: minifyHTML } = require("html-minifier-terser");
const fs = require("fs-extra");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const DIST = path.join(__dirname, "dist");

// 1️⃣ Clean dist folder
fs.removeSync(DIST);
fs.mkdirSync(DIST);

// 2️⃣ Copy everything except dev stuff
fs.readdirSync(__dirname).forEach(item => {
  if (["dist", "build.js", "node_modules"].includes(item)) return;
  fs.copySync(path.join(__dirname, item), path.join(DIST, item));
});

console.log("✅ Files copied to dist/");

// 🔹 Obfuscate JS after minify
const obfuscateJSFiles = folder => {
  fs.readdirSync(folder).forEach(file => {
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) return obfuscateJSFiles(filePath);
    if (file.endsWith(".js")) {
      const code = fs.readFileSync(filePath, "utf-8");
      const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        stringArray: true,
        stringArrayEncoding: ["rc4"],
        stringArrayThreshold: 0.75
      });
      fs.writeFileSync(filePath, obfuscated.getObfuscatedCode());
    }
  });
};

// 3️⃣ Minify CSS
const minifyCSSFiles = folder => {
  fs.readdirSync(folder).forEach(file => {
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) return minifyCSSFiles(filePath);
    if (file.endsWith(".css")) {
      const css = fs.readFileSync(filePath, "utf-8");
      const min = csso.minify(css).css;
      fs.writeFileSync(filePath, min);
    }
  });
};

// 4️⃣ Minify JS
const minifyJSFiles = async folder => {
  for (const file of fs.readdirSync(folder)) {
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await minifyJSFiles(filePath);
    } else if (file.endsWith(".js")) {
      const tempOut = filePath + ".min.tmp.js";
      await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        minify: true,
        format: "esm",
        keepNames: true, // prevents breaking exports
        outfile: tempOut
      });
      fs.renameSync(tempOut, filePath);
    }
  }
};

// 5️⃣ Minify HTML
const minifyHTMLFiles = async folder => {
  for (const file of fs.readdirSync(folder)) {
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await minifyHTMLFiles(filePath);
    } else if (file.endsWith(".html")) {
      const html = fs.readFileSync(filePath, "utf-8");
      const min = await minifyHTML(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true
      });
      fs.writeFileSync(filePath, min);
    }
  }
};

// 6️⃣ Run Build
(async () => {
  console.log("🚀 Minifying CSS...");
  minifyCSSFiles(DIST);

  console.log("🚀 Minifying JS...");
  await minifyJSFiles(DIST);

  console.log("🔒 Obfuscating JS...");
  obfuscateJSFiles(DIST);

  console.log("🚀 Minifying HTML...");
  await minifyHTMLFiles(DIST);

  console.log("✅ Build complete! Everything is in dist/");
})();