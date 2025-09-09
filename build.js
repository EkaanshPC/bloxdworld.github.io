const esbuild = require("esbuild");
const csso = require("csso");
const { minify: minifyHTML } = require("html-minifier-terser");
const fs = require("fs-extra");
const path = require("path");

const DIST = path.join(__dirname, "dist");

// Clean dist
fs.removeSync(DIST);
fs.mkdirSync(DIST);

// Copy everything except 'dist' and 'build.js'
fs.readdirSync(__dirname).forEach(item => {
  if (item === "dist" || item === "build.js" || item === "node_modules") return; // skip dev stuff
  const srcPath = path.join(__dirname, item);
  const destPath = path.join(DIST, item);
  fs.copySync(srcPath, destPath);
});



console.log("✅ All files copied to dist/ without breaking fs-extra");



// 3️⃣ Minify CSS files
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

// 4️⃣ Minify JS files
const minifyJSFiles = async folder => {
  for (const file of fs.readdirSync(folder)) {
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) await minifyJSFiles(filePath);
    else if (file.endsWith(".js")) {
      const tempOut = filePath + ".min.tmp.js";
      await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        minify: true,
        format: "esm",
        keepNames: true, // <--- THIS prevents function/variable renaming
        outfile: tempOut
      });
      fs.renameSync(tempOut, filePath); // overwrite original
    }
  }
};

// 5️⃣ Minify HTML files
const minifyHTMLFiles = async folder => {
  for (const file of fs.readdirSync(folder)) {
    const filePath = path.join(folder, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) await minifyHTMLFiles(filePath);
    else if (file.endsWith(".html")) {
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

// 6️⃣ Run build
(async () => {
  console.log("🚀 Minifying CSS...");
  minifyCSSFiles(DIST);

  console.log("🚀 Minifying JS...");
  await minifyJSFiles(DIST);

  console.log("🚀 Minifying HTML...");
  await minifyHTMLFiles(DIST);

  console.log("✅ Build complete! All files copied and minified in dist/");
})();
