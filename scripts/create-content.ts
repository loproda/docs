import inquirer from "inquirer";
import { join } from "path";
import { readdir, writeFile } from "fs/promises";
import { formatDate } from "date-fns";

function textToUri(text: string) {
	const t = text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return t;
}

async function changelogPrompt() {
	const basePath = join(process.cwd(), "src/content/changelog");
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

	const date = formatDate(new Date(), "yyyy-MM-dd");

	const content = `---
title: ${res.title}
description: ${res.description}
products:
  - ${res.folder}
date: ${date}
---

${res.description}
`;

	await writeFile(
		join(basePath, res.folder, `${textToUri(`${date}-${res.title}`)}.mdx`),
		content,
		"utf-8",
	);
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
			],
		},
	])
	.then(async (answers) => {
		if (answers.type === "changelog") {
			await changelogPrompt();
		}
	});
