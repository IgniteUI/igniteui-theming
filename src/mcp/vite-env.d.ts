/// <reference types="vite/client" />

/**
 * Module declaration for importing markdown files with ?raw suffix.
 * This enables: import content from './doc.md?raw'
 */
declare module "*.md?raw" {
	const content: string;
	export default content;
}

/**
 * Fallback for direct .md imports (though we'll use ?raw explicitly).
 */
declare module "*.md" {
	const content: string;
	export default content;
}
