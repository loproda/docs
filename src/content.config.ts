import { defineCollection } from "astro:content";

import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

import { glob } from "astro/loaders";

import {
	changelogSchema,
	baseSchema,
	partialsSchema,
	releaseNotesSchema,
} from "~/schemas";

function contentLoader(name: string) {
	return glob({
		pattern: "**/*.(md|mdx)",
		base: "./src/content/" + name,
	});
}

function dataLoader(name: string) {
	return glob({
		pattern: "**/*.(json|yml|yaml)",
		base: "./src/content/" + name,
	});
}

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: baseSchema,
		}),
	}),
	changelog: defineCollection({
		loader: contentLoader("changelog"),
		schema: changelogSchema,
	}),
	partials: defineCollection({
		loader: contentLoader("partials"),
		schema: partialsSchema,
	}),
	products: defineCollection({
		loader: dataLoader("products"),
	}),
	"release-notes": defineCollection({
		loader: dataLoader("release-notes"),
		schema: releaseNotesSchema,
	}),
};
