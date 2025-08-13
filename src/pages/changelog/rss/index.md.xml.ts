import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getChangelogs, getRSSItems } from "~/util/changelog";

export const GET: APIRoute = async ({ locals }) => {
	const notes = await getChangelogs({
		filter: (entry) => !entry.data.hidden,
	});

	const items = await getRSSItems({
		notes,
		locals,
		markdown: true,
	});

	return rss({
		title: "Historial de cambios de Loproda",
		description: `Variante del registro de cambios de Loproda con contenido Markdown en lugar de HTML`,
		site: "https://docs.loproda.com/changelog/",
		items,
	});
};
