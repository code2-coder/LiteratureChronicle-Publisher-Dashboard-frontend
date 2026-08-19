import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';


import { readFileSync } from 'node:fs';

import viteCompression from 'vite-plugin-compression';

const isDev = process.env.NODE_ENV !== 'production';

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;

const configHorizonsConsoleErrorHandler = `
const originalConsoleError = console.error;
const MATCH_LINE_COL_REGEX = /:(\\d+):(\\d+)\\)?\\s*$/; // regex to match the :lineNum:colNum
const MATCH_AT_REGEX = /^\\s*at\\s+(?:async\\s+)?(?:.*?\\s+)?\\(?/; // regex to remove the 'at' keyword and any 'async' or function name
const MATCH_PATH_REGEX = /^\\//; // regex to remove the leading slash

function parseStackFrameLine(line) {
	const lineColMatch = line.match(MATCH_LINE_COL_REGEX);
	if (!lineColMatch) return null;
	const [, lineNum, colNum] = lineColMatch;
	const suffix = \`:\${lineNum}:\${colNum}\`;
	const idx = line.lastIndexOf(suffix);
	if (idx === -1) return null;
	const before = line.substring(0, idx);
	const path = before.replace(MATCH_AT_REGEX, '').trim();
	
	if (!path) return null;

	try {
		const pathname = new URL(path).pathname;
		const filePath = pathname.replace(MATCH_PATH_REGEX, '') || pathname;
		return \`\${filePath}:\${lineNum}:\${colNum}\`;
	} catch (e) {
		const filePath = path.replace(MATCH_PATH_REGEX, '') || path;
		return \`\${filePath}:\${lineNum}:\${colNum}\`;
	}
}

function getFilePathFromStack(stack, skipFrames = 0) {
	if (!stack || typeof stack !== 'string') return null;
	const lines = stack.split('\\n').slice(1);

	const frames = lines.map(line => parseStackFrameLine(line.replace(/\\r$/, ''))).filter(Boolean);

	return frames[skipFrames] ?? null;
}

console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';
	let filePath = null;

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			filePath = getFilePathFromStack(arg.stack, 0);
			errorString = \`\${arg.name}: \${arg.message}\`;
			if (filePath) {
				errorString = \`\${errorString} at \${filePath}\`;
			}
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
		const stack = new Error().stack;
		filePath = getFilePathFromStack(stack, 1);
		if (filePath) {
			errorString = \`\${errorString} at \${filePath}\`;
		}
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/\.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;

const configNavigationHandler = `
if (window.navigation && window.self !== window.top) {
	window.navigation.addEventListener('navigate', (event) => {
		const url = event.destination.url;

		try {
			const destinationUrl = new URL(url);
			const destinationOrigin = destinationUrl.origin;
			const currentOrigin = window.location.origin;

			if (destinationOrigin === currentOrigin) {
				return;
			}
		} catch (error) {
			return;
		}

		window.parent.postMessage({
			type: 'horizons-navigation-error',
			url,
		}, '*');
	});
}
`;

const addTransformIndexHtml = {
	name: 'add-transform-index-html',
	transformIndexHtml(html) {
		const tags = [
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsRuntimeErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsViteErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsConsoleErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configWindowFetchMonkeyPatch,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configNavigationHandler,
				injectTo: 'head',
			},
		];

		if (!isDev && process.env.TEMPLATE_BANNER_SCRIPT_URL && process.env.TEMPLATE_REDIRECT_URL) {
			tags.push(
				{
					tag: 'script',
					attrs: {
						src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
						'template-redirect-url': process.env.TEMPLATE_REDIRECT_URL,
					},
					injectTo: 'head',
				}
			);
		}

		return {
			html,
			tags,
		};
	},
};

console.warn = () => { };

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
		return;
	}

	loggerError(msg, options);
}

export default defineConfig({
	clearScreen: false,
	root: path.resolve(__dirname),
	customLogger: logger,
	plugins: [
		react(),
		addTransformIndexHtml,
		viteCompression({
			algorithm: 'brotliCompress',
			ext: '.br',
		}),
		viteCompression({
			algorithm: 'gzip',
			ext: '.gz',
		}),
	],
	server: {
		port: 3000,
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://127.0.0.1:8080',
				changeOrigin: true,
				proxyTimeout: 10000,
				timeout: 10000,
				configure: (proxy) => {
					proxy.on('error', (err, req, res) => {
						// Retry on ECONNREFUSED (backend restarting) up to 3 times
						const maxRetries = 3;
						req._retryCount = (req._retryCount || 0) + 1;
						if (req._retryCount <= maxRetries && err.code === 'ECONNREFUSED') {
							setTimeout(() => {
								proxy.web(req, res, {
									target: process.env.VITE_API_URL || 'http://127.0.0.1:8080',
								});
							}, 300 * req._retryCount);
						} else {
							// After retries exhausted, return a clean JSON error
							if (!res.headersSent) {
								res.writeHead(503, { 'Content-Type': 'application/json' });
								res.end(JSON.stringify({ message: 'Backend service unavailable. Please wait a moment and try again.' }));
							}
						}
					});
				},
			},
		},
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json',],
		alias: {
			'@/lib/utils': path.resolve(__dirname, './src/utils/utils.js'),
			'@/lib/apiClient': path.resolve(__dirname, './src/services/apiClient.js'),
			'@/lib/royaltyCalculator': path.resolve(__dirname, './src/utils/royaltyCalculator.js'),
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						if (id.includes('xlsx')) {
							return 'xlsx';
						}
						if (id.includes('recharts')) {
							return 'recharts';
						}
						if (id.includes('framer-motion')) {
							return 'framer-motion';
						}
						if (id.includes('lucide-react')) {
							return 'lucide-react';
						}
						return 'vendor';
					}
				},
			},
		}
	}
});
