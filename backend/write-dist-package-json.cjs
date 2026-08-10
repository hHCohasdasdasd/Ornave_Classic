// Overrides the module type for compiled output only. The root package.json
// declares "type": "module" (needed for `tsx` in dev), but tsc compiles this
// project's ESM import/export syntax down to CommonJS (see tsconfig.json —
// avoids needing explicit .js extensions on 200+ relative imports). Without
// this file, Node would try to parse the CommonJS dist/*.js files as ESM and
// fail immediately on `require()`.
const fs = require('fs');
fs.writeFileSync('dist/package.json', JSON.stringify({ type: 'commonjs' }));
