import inquirer from "inquirer";
import { join } from "path";
import { mkdir, readdir, writeFile } from "fs/promises";
import { formatDate } from "date-fns";
import { existsSync } from "fs";

interface CreateChangelogProps {
	title: string;
	description: string;
	product: string;
}

const rootPath = join(process.cwd(), "src/content");

function textToUri(text: string) {
	const t = text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return t;
}

async function createChangelog(props: CreateChangelogProps) {
	const date = formatDate(new Date(), "yyyy-MM-dd");
	const content = `---
title: ${props.title}
description: ${props.description}
products:
  - ${props.product}
date: ${date}
---

${props.description}
`;

	await writeFile(
		join(
			rootPath,
			"changelog",
			props.product,
			`${textToUri(`${date}-${props.title}`)}.mdx`,
		),
		content,
		"utf-8",
	);
}

// prompts
async function changelogPrompt() {
	const basePath = join(rootPath, "changelog");
	const dir = await readdir(basePath);
	const res = await inquirer.prompt([
		{
			type: "list",
			name: "folder",
			message: "Producto",
			choices: dir,
		},
		{
			type: "input",
			name: "title",
			message: "Titulo",
		},
		{
			type: "input",
			name: "description",
			message: "Descripción",
		},
	]);

	await createChangelog({
		title: res.title,
		description: res.title,
		product: res.folder,
	});
}

async function productPrompt() {
	const basePath = join(rootPath, "products");
	const res = await inquirer.prompt([
		{
			type: "input",
			name: "name",
			message: "Nombre",
		},
		{
			type: "input",
			name: "description",
			message: "Descripción",
		},
	]);

	const nameUri = textToUri(res.name);
	if (existsSync(join(basePath, nameUri))) {
		console.error(`Ya existe un proyecto: ${res.name} (${nameUri})`);
		return;
	}

	const content = `name: ${res.name}
logo: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M42 10.5h-4.5v-3l-2.025-1.403L24 10.395 12.525 6.097 10.5 7.5v3H6L4.5 12v30L6 43.5h36l1.5-1.5V12L42 10.5Zm-16.5 2.542 9-3.375v25.395l-9 4.5v-26.52Zm-12-3.375 9 3.375V39.54l-9-4.5V9.667Zm-6 3.833h3V36l.832 1.343L17.61 40.5H7.5v-27Zm33 27H30.39l6.277-3.127L37.5 36V13.5h3v27Z"/></svg>

product:
  title: ${res.name}
  url: /${nameUri}/
  wrap: true
  group: Core
  additional_groups: []

meta:
  title: ${res.name}
  description: ${res.description}
  author: "@fvcoder"
`;
	const changelogPath = join(rootPath, "changelog", nameUri);
	await mkdir(changelogPath, { recursive: true });
	await createChangelog({
		title: `Hola mundo! Hola ${res.name}`,
		description: res.description,
		product: nameUri,
	});

	const docsPath = join(rootPath, "docs", nameUri);
	await mkdir(docsPath, { recursive: true });
	const docsContent = `---
title: ${res.name}
pcx_content_type: overview
sidebar:
  order: 1
head:
  - tag: title
    content: Overview
---

${res.description}
`;
	await writeFile(join(docsPath, `index.mdx`), docsContent, "utf-8");
	await writeFile(
		join(process.cwd(), `src/icons/${nameUri}.svg`),
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M42 10.5h-4.5v-3l-2.025-1.403L24 10.395 12.525 6.097 10.5 7.5v3H6L4.5 12v30L6 43.5h36l1.5-1.5V12zm-16.5 2.542 9-3.375v25.395l-9 4.5zm-12-3.375 9 3.375V39.54l-9-4.5zm-6 3.833h3V36l.832 1.343L17.61 40.5H7.5zm33 27H30.39l6.277-3.127L37.5 36V13.5h3z"/></svg>`,
		"utf-8",
	);

	await writeFile(join(basePath, `${nameUri}.yml`), content, "utf-8");
}

inquirer
	.prompt([
		{
			type: "list",
			name: "type",
			message: "¿Que contenido desea crear?",
			choices: [
				{
					name: "Changelog",
					value: "changelog",
				},
				{
					name: "Producto",
					value: "product",
				},
			],
		},
	])
	.then(async (answers) => {
		if (answers.type === "changelog") {
			await changelogPrompt();
		}
		if (answers.type === "product") {
			await productPrompt();
		}
	});
