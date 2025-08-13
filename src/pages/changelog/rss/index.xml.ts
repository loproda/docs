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
	});

	return rss({
		title: "Historial de cambios",
		description: `Actualizaciones de varios productos de Loproda`,
		site: "https://docs.loproda.com/changelog/",
		items,
	});
};
