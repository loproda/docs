import type { AstroGlobal } from "astro";
import type { StarlightRouteData } from "@astrojs/starlight/route-data";

import { getEntry, getCollection } from "astro:content";
import { externalLinkArrow } from "~/plugins/rehype/external-links";

type Link = Extract<StarlightRouteData["sidebar"][0], { type: "link" }> & {
	order?: number;
	icon?: { lottieLink: string };
};
type Group = Extract<StarlightRouteData["sidebar"][0], { type: "group" }> & {
	order?: number;
	icon?: { lottieLink: string };
};

export type SidebarEntry = Link | Group;
type Badge = Link["badge"];

const products = await getCollection("products");
const sidebars = new Map<string, Group>();

export async function getSidebar(context: AstroGlobal) {
	const pathname = context.url.pathname;
	const segments = pathname.split("/").filter(Boolean);

	const product = segments.at(0);

	if (!product) {
		throw new Error(`[Sidebar] Splitting ${pathname} resulted in 0 segments`);
	}

	let key: string;
	let module: string | undefined;
	if (product === "learning-paths") {
		module = segments.at(1);

		if (!module) {
			throw new Error(
				`[Sidebar] Unable to get the learning path module name from ${segments}`,
			);
		}

		key = product.concat(module);
	} else {
		key = product;
	}

	let memoized = sidebars.get(key);

	if (!memoized) {
		let group = context.locals.starlightRoute.sidebar
			.filter((entry) => entry.type === "group" && entry.label === product)
			.at(0) as Group;

		if (module) {
			group = group.entries
				.filter((entry) => entry.type === "group" && entry.label === module)
				.at(0) as Group;
		}

		if (!group) {
			throw new Error(
				`[Sidebar] Couldn't find a group for ${product} ${module && `${module}`}`,
			);
		}

		const intermediate = structuredClone(group);
		memoized = await generateSidebar(intermediate);

		sidebars.set(key, memoized);
	}

	const sidebar = structuredClone(memoized);
	setSidebarCurrentEntry(sidebar.entries, pathname);

	return sidebar;
}

export async function generateSidebar(group: Group) {
	group.entries = await Promise.all(
		group.entries.map((entry) => {
			if (entry.type === "group") {
				return handleGroup(entry);
			} else {
				return handleLink(entry);
			}
		}),
	);

	group.entries.sort(sortBySidebarOrder);

	if (group.entries[0].type === "link") {
		group.entries[0].label = "Overview";
	}

	const product = products.find((p) => p.id === group.label);
	if (product && product.data.product.group === "Developer platform") {
		const links = [
			["llms.txt", "/llms.txt"],
			["prompt.txt", "/workers/prompt.txt"],
			[`${product.data.name} llms-full.txt`, `/${product.id}/llms-full.txt`],
			["Developer Platform llms-full.txt", "/developer-platform/llms-full.txt"],
		];

		group.entries.push({
			type: "group",
			label: "LLM resources",
			entries: links.map(([label, href]) => ({
				type: "link",
				label,
				href,
				isCurrent: false,
				attrs: {
					target: "_blank",
				},
				badge: undefined,
			})),
			collapsed: true,
			badge: undefined,
		});
	}

	return group;
}

function setSidebarCurrentEntry(
	sidebar: SidebarEntry[],
	pathname: string,
): boolean {
	for (const entry of sidebar) {
		if (entry.type === "link") {
			if (entry.attrs["data-external-link"]) {
				continue;
			}

			const href = entry.href;

			// Compare with and without trailing slash
			if (href === pathname || href.slice(0, -1) === href) {
				entry.isCurrent = true;
				return true;
			}
		}

		if (
			entry.type === "group" &&
			setSidebarCurrentEntry(entry.entries, pathname)
		) {
			return true;
		}

		const flattened = flattenSidebar(sidebar)
			.filter(
				(link) =>
					link.attrs["data-hide-children"] && pathname.startsWith(link.href),
			)
			.at(0);

		if (
			flattened &&
			entry.type === "link" &&
			entry.href.startsWith(flattened.href)
		) {
			entry.isCurrent = true;
			entry.attrs = {};
			return true;
		}
	}

	return false;
}

export function flattenSidebar(sidebar: SidebarEntry[]): Link[] {
	return sidebar.flatMap((entry) => {
		if (entry.type === "group") {
			return flattenSidebar(entry.entries);
		}

		return entry;
	});
}

async function handleGroup(group: Group): Promise<SidebarEntry> {
	const index = group.entries.find(
		(entry) => entry.type === "link" && entry.href.endsWith(`/${group.label}/`),
	) as Link | undefined;

	if (!index) {
		throw new Error(
			`[Sidebar] Unable to find an index.md(x) file for ${group.label}`,
		);
	}

	const entry = await getEntry("docs", index.href.slice(1, -1));

	if (!entry) {
		throw new Error(
			`[Sidebar] Unable to load ${index.href} from the docs collection`,
		);
	}

	const frontmatter = entry.data;

	group.icon = frontmatter.sidebar.group?.icon ?? frontmatter.icon;
	group.label = frontmatter.sidebar.group?.label ?? frontmatter.title;
	group.order = frontmatter.sidebar.order ?? Number.MAX_VALUE;

	if (frontmatter.sidebar.group?.badge) {
		group.badge = inferBadgeVariant(frontmatter.sidebar.group?.badge);
	}

	if (frontmatter.hideChildren) {
		return {
			type: "link",
			href: index.href,
			icon: group.icon,
			label: group.label,
			order: group.order,
			attrs: {
				"data-hide-children": true,
			},
			badge: group.badge,
			isCurrent: false,
		};
	}

	for (const entry of group.entries.keys()) {
		if (group.entries[entry].type === "group") {
			group.entries[entry] = await handleGroup(group.entries[entry] as Group);
		} else {
			group.entries[entry] = await handleLink(group.entries[entry] as Link);
		}
	}

	const idx = group.entries.indexOf(index);

	if (idx === -1) {
		throw new Error(
			`[Sidebar] Originally located ${index.href} in ${group.label} entries but unable to find it post-transform`,
		);
	}

	const removed = group.entries.splice(idx, 1).at(0) as Link;

	removed.attrs = {
		"data-group-label": group.label,
	};

	if (!removed) {
		throw new Error(
			`[Sidebar] Failed to splice ${index.href} in ${group.label}`,
		);
	}

	if (!frontmatter.sidebar.group?.hideIndex) {
		removed.order = 0;
		removed.label = frontmatter.sidebar.label ?? "Overview";

		group.entries.unshift(removed);
	}

	group.entries.sort(sortBySidebarOrder);

	return group;
}

async function handleLink(link: Link): Promise<Link> {
	const entry = await getEntry("docs", link.href.slice(1, -1));

	if (!entry) {
		throw new Error(
			`[Sidebar] Unable to load ${link.href} from docs collection`,
		);
	}

	const frontmatter = entry.data;
	link.order = frontmatter.sidebar.order ?? Number.MAX_VALUE;
	link.isCurrent = false;

	if (link.href.split("/").filter(Boolean).length === 1) {
		link.order = 0;
	}

	if (link.badge) {
		link.badge = inferBadgeVariant(link.badge);
	}

	if (frontmatter.external_link && !frontmatter.sidebar.group?.hideIndex) {
		return {
			...link,
			icon: frontmatter.icon,
			label: link.label.concat(externalLinkArrow),
			href: frontmatter.external_link,
			badge: frontmatter.external_link.startsWith("/api")
				? {
						text: "API",
						variant: "note",
					}
				: link.badge,
			attrs: {
				"data-external-link": true,
			},
		};
	}

	return link;
}

function inferBadgeVariant(badge: Badge) {
	if (!badge) return undefined;

	if (badge.variant === "default") {
		switch (badge.text) {
			case "Beta": {
				badge.variant = "caution";
				break;
			}
			case "New": {
				badge.variant = "note";
				break;
			}
			case "Deprecated":
			case "Legacy": {
				badge.variant = "danger";
				break;
			}
		}
	}

	return badge;
}

export const lookupProductTitle = async (product: string, module: string) => {
	if (product === "learning-paths") {
		const entry = await getEntry("learning-paths", module);

		return `${entry?.data?.title} (Learning Paths)`;
	} else if (product === "1.1.1.1") {
		const entry = await getEntry("products", "1111");

		return entry?.data?.product?.title;
	}

	const entry = await getEntry("products", product);

	return entry?.data?.product?.title ?? "Unknown";
};

export function sortBySidebarOrder(a: any, b: any): number {
	const aOrder = a.order ?? a.data.sidebar.order;
	const aLabel = a.label ?? a.data.title;

	const bOrder = b.order ?? b.data.sidebar.order;
	const bLabel = b.label ?? b.data.title;

	if (aOrder !== bOrder) return aOrder - bOrder;

	const collator = new Intl.Collator("en");

	return collator.compare(aLabel, bLabel);
}
