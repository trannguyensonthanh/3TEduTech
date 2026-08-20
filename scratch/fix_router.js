const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../edu-ai-learning-hub/src/router.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace lazy imports
content = content.replace(/const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\(\)\s*=>\s*import\('([^']+)'\)\);/g, "import $1 from '$2';");

// 2. Remove Suspense wrappers
content = content.replace(/<Suspense fallback=\{<PageLoader \/>\}>/g, '<>');
content = content.replace(/<\/Suspense>/g, '</>');

// 3. Remove PageLoader component since it's no longer used
content = content.replace(/const PageLoader = \(\) => \([\s\S]*?\n\);\n/, '');

// 4. Remove Suspense and lazy from React import
content = content.replace(/import React, { Suspense, lazy } from 'react';/, "import React from 'react';");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed router.tsx');
