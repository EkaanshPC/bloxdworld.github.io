const esbuild = require("esbuild");
const csso = require("csso");
const { minify: minifyHTML } = require("html-minifier-terser");
const fs = require("fs-extra");
const path = require("path");

// Paths
const DIST = path.join(__dirname, "dist");
const ASSETS = path.join(__dirname, "assets");
const STYLES = path.join(__dirname, "styles");
const JS = path.join(__dirname, "js");
const FUNCTIONS = path.join(__dirname, "functions");

async function build() {
  // Clean dist
  fs.removeSync(DIST);
  fs.mkdirSync(DIST);

  // Copy assets as-is
  fs.copySync(ASSETS, path.join(DIST, "assets"));

  // Minify CSS
  for (const file of fs.readdirSync(STYLES)) {
    if (file.endsWith(".css")) {
      const css = fs.readFileSync(path.join(STYLES, file), "utf-8");
      const min = csso.minify(css).css;
      await fs.outputFile(path.join(DIST, "styles", file), min);
    }
  }

  // Minify JS (js/ and functions/)
  const processJSFolder = async folder => {
    for (const file of fs.readdirSync(folder)) {
      const filePath = path.join(folder, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        await processJSFolder(filePath); // recurse
      } else if (file.endsWith(".js")) {
        await esbuild.build({
          entryPoints: [filePath],
          bundle: true,
          minify: true,
          outfile: path.join(DIST, path.relative(__dirname, filePath))
        });
      }
    }
  };

  await processJSFolder(JS);
  await processJSFolder(FUNCTIONS);

  // Minify HTML files in root
  for (const file of fs.readdirSync(__dirname)) {
    if (file.endsWith(".html")) {
      const html = fs.readFileSync(file, "utf-8");
      const min = await minifyHTML(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true
      });
      await fs.outputFile(path.join(DIST, file), min);
    }
  }

  console.log("✅ Build complete! Check the dist/ folder.");
}

build().catch(err => console.error(err));
