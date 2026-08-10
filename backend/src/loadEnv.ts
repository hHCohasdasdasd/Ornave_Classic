import dotenv from 'dotenv';

// Must be the very first import in index.ts. ES module imports execute
// before any other code in the importing file, so if dotenv.config() were
// just a function call inside index.ts (even at the top), everything index.ts
// imports (routes -> controllers -> services -> tokenManager, which reads
// process.env.JWT_SECRET at module-load time) would already have executed
// first, seeing an empty environment. Isolating the config() call in its own
// side-effect-only module and importing *that* first fixes the ordering.
dotenv.config();
