import { useEffect, useState } from "react";
import ReactSelect from "./ReactSelect";
import type { CollectionEntry } from "astro:content";

type DocsData = keyof CollectionEntry<"docs">["data"];

type ResourcesData = DocsData;

interface Props {
	resources: Array<CollectionEntry<"docs">>;
	facets: Record<string, string[]>;
	filters?: ResourcesData[];
	columns: number;
}

export default function ResourcesBySelector({
	resources,
	facets,
	filters,
	columns,
}: Props) {
	const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

	const handleFilterChange = (option: any) => {
		setSelectedFilter(option?.value || null);
	};

	const options = Object.entries(facets).map(([key, values]) => ({
		label: key,
		options: values.map((v) => ({
			value: v,
			label: v,
		})),
	}));

	const visibleResources = resources.filter((resource) => {
		if (!selectedFilter || !filters) return true;

		const filterableValues: string[] = [];
		for (const filter of filters) {
			const val = resource.data[filter as keyof typeof resource.data];
			if (val) {
				if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
					filterableValues.push(...val);
				} else if (typeof val === "string") {
					filterableValues.push(val);
				}
			}
		}

		return filterableValues.includes(selectedFilter);
	});

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const value = params.get("filters");

		if (value) {
			setSelectedFilter(value);
		}
	}, []);

	return (
		<div>
			{filters && (
				<div className="not-content">
					<ReactSelect
						className="mt-2"
						value={
							selectedFilter
								? { value: selectedFilter, label: selectedFilter }
								: null
						}
						options={options}
						onChange={handleFilterChange}
						isClearable
						placeholder="Filter resources..."
					/>
				</div>
			)}

			<div
				className={`grid ${columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} grid-cols-1 gap-4`}
			>
				{visibleResources.map((page) => {
					const href = `/${page.id}/`;

					return (
						<a
							key={page.id}
							href={href}
							className="flex flex-col gap-2 rounded-sm border border-solid border-gray-200 p-6 text-black no-underline hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
						>
							<p className="decoration-accent underline decoration-2 underline-offset-4">
								{page.data.title}
							</p>
							<span className="line-clamp-3" title={page.data.description}>
								{page.data.description}
							</span>
						</a>
					);
				})}
			</div>
		</div>
	);
}
