import { useEffect, useState, useMemo } from "react";
import ModelInfo from "./models/ModelInfo";
import ModelBadges from "./models/ModelBadges";
import { authorData } from "./models/data";
import type { WorkersAIModelsSchema } from "~/schemas";
import { setSearchParams } from "~/util/url";

type Filters = {
	search: string;
	authors: string[];
	tasks: string[];
	capabilities: string[];
};

const ModelCatalog = ({ models }: { models: WorkersAIModelsSchema[] }) => {
	const [filters, setFilters] = useState<Filters>({
		search: "",
		authors: [],
		tasks: [],
		capabilities: [],
	});

	// List of model names to pin at the top
	const pinnedModelNames = [
		"@cf/openai/gpt-oss-120b",
		"@cf/openai/gpt-oss-20b",
		"@cf/meta/llama-4-scout-17b-16e-instruct",
		"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
		"@cf/meta/llama-3.1-8b-instruct-fast",
	];

	// Sort models by pinned status first, then by created_at date
	const sortedModels = useMemo(() => {
		return [...models].sort((a, b) => {
			// First check if either model is pinned
			const isPinnedA = pinnedModelNames.includes(a.name);
			const isPinnedB = pinnedModelNames.includes(b.name);

			// If pinned status differs, prioritize pinned models
			if (isPinnedA && !isPinnedB) return -1;
			if (!isPinnedA && isPinnedB) return 1;

			// If both are pinned, sort by position in pinnedModelNames array (for manual ordering)
			if (isPinnedA && isPinnedB) {
				return (
					pinnedModelNames.indexOf(a.name) - pinnedModelNames.indexOf(b.name)
				);
			}

			// If neither is pinned, sort by created_at date (newest first)
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB.getTime() - dateA.getTime();
		});
	}, [models]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);

		const search = params.get("search") ?? "";
		const authors = params.getAll("authors");
		const tasks = params.getAll("tasks");
		const capabilities = params.getAll("capabilities");

		setFilters({
			search,
			authors,
			tasks,
			capabilities,
		});
	}, []);

	useEffect(() => {
		const params = new URLSearchParams();

		if (filters.search) {
			params.set("search", filters.search);
		}

		if (filters.authors.length > 0) {
			filters.authors.forEach((author) => params.append("authors", author));
		}

		if (filters.tasks.length > 0) {
			filters.tasks.forEach((task) => params.append("tasks", task));
		}

		if (filters.capabilities.length > 0) {
			filters.capabilities.forEach((capability) =>
				params.append("capabilities", capability),
			);
		}

		setSearchParams(params);
	}, [filters]);

	const mapped = sortedModels.map((model) => ({
		model: {
			...model,
			capabilities: model.properties
				.flatMap(({ property_id, value }) => {
					if (property_id === "lora" && value === "true") {
						return "LoRA";
					}

					if (property_id === "function_calling" && value === "true") {
						return "Function calling";
					}

					if (property_id === "async_queue" && value === "true") {
						return "Batch";
					}

					return [];
				})
				.filter((p) => Boolean(p)),
		},
		model_display_name: model.name.split("/").at(-1),
	}));

	const tasks = [...new Set(models.map((model) => model.task.name))];
	const authors = [...new Set(models.map((model) => model.name.split("/")[1]))];
	const capabilities = [
		...new Set(
			models.flatMap((model) =>
				model.properties
					.flatMap(({ property_id, value }) => {
						if (property_id === "lora" && value === "true") {
							return "LoRA";
						}

						if (property_id === "function_calling" && value === "true") {
							return "Function calling";
						}

						if (property_id === "async_queue" && value === "true") {
							return "Batch";
						}

						return [];
					})
					.filter((p) => Boolean(p)),
			),
		),
	];

	const modelList = mapped.filter(({ model }) => {
		if (filters.authors.length > 0) {
			if (!filters.authors.includes(model.name.split("/")[1])) {
				return false;
			}
		}

		if (filters.tasks.length > 0) {
			if (!filters.tasks.includes(model.task.name)) {
				return false;
			}
		}

		if (filters.capabilities.length > 0) {
			if (!model.capabilities.some((c) => filters.capabilities.includes(c))) {
				return false;
			}
		}

		if (filters.search) {
			if (!model.name.toLowerCase().includes(filters.search.toLowerCase())) {
				return false;
			}
		}

		return true;
	});

	return (
		<div className="md:flex">
			<div className="mr-8 w-full md:w-1/4">
				<input
					type="text"
					className="mb-8 w-full rounded-md border-2 border-gray-200 bg-white px-2 py-2 dark:border-gray-700 dark:bg-gray-800"
					placeholder="Search models"
					value={filters.search}
					onChange={(e) => setFilters({ ...filters, search: e.target.value })}
				/>

				<div className="mb-8! hidden md:block">
					<span className="text-sm font-bold text-gray-600 uppercase dark:text-gray-200">
						Tasks
					</span>

					{tasks.map((task) => (
						<label key={task} className="my-2! block">
							<input
								type="checkbox"
								className="mr-2"
								value={task}
								checked={filters.tasks.includes(task)}
								onChange={(e) => {
									const target = e.target as HTMLInputElement;

									if (target.checked) {
										setFilters({
											...filters,
											tasks: [...filters.tasks, target.value],
										});
									} else {
										setFilters({
											...filters,
											tasks: filters.tasks.filter((f) => f !== target.value),
										});
									}
								}}
							/>{" "}
							{task}
						</label>
					))}
				</div>

				<div className="mb-8! hidden md:block">
					<span className="text-sm font-bold text-gray-600 uppercase dark:text-gray-200">
						Capabilities
					</span>

					{capabilities.map((capability) => (
						<label key={capability} className="my-2! block">
							<input
								type="checkbox"
								value={capability}
								checked={filters.capabilities.includes(capability)}
								className="mr-2"
								onChange={(e) => {
									const target = e.target as HTMLInputElement;

									if (target.checked) {
										setFilters({
											...filters,
											capabilities: [...filters.capabilities, target.value],
										});
									} else {
										setFilters({
											...filters,
											capabilities: filters.capabilities.filter(
												(f) => f !== target.value,
											),
										});
									}
								}}
							/>{" "}
							{capability}
						</label>
					))}
				</div>

				<div className="hidden md:block">
					<span className="text-sm font-bold text-gray-600 uppercase dark:text-gray-200">
						Authors
					</span>

					{authors.map((author) => (
						<label key={author} className="my-2! block">
							<input
								type="checkbox"
								className="mr-2"
								value={author}
								checked={filters.authors.includes(author)}
								onChange={(e) => {
									const target = e.target as HTMLInputElement;

									if (target.checked) {
										setFilters({
											...filters,
											authors: [...filters.authors, target.value],
										});
									} else {
										setFilters({
											...filters,
											authors: filters.authors.filter(
												(f) => f !== target.value,
											),
										});
									}
								}}
							/>{" "}
							{authorData[author] ? authorData[author].name : author}
						</label>
					))}
				</div>
			</div>
			<div className="mt-0! flex w-full flex-wrap items-stretch gap-[1%] self-start md:w-3/4">
				{modelList.length === 0 && (
					<div className="flex w-full flex-col justify-center rounded-md border bg-gray-50 py-6 text-center align-middle dark:border-gray-500 dark:bg-gray-800">
						<span className="text-lg font-bold!">No models found</span>
						<p>
							Try a different search term, or broaden your search by removing
							filters.
						</p>
					</div>
				)}
				{modelList.map((model) => {
					const isBeta = model.model.properties.find(
						({ property_id, value }) =>
							property_id === "beta" && value === "true",
					);

					const author = model.model.name.split("/")[1];
					const authorInfo = authorData[author];
					const isPinned = pinnedModelNames.includes(model.model.name);

					return (
						<a
							key={model.model.id}
							className="relative mb-3 block w-full self-start rounded-md border border-solid border-gray-200 p-3 text-inherit! no-underline hover:bg-gray-50 lg:w-[48%] dark:border-gray-700 dark:hover:bg-gray-800"
							href={`/workers-ai/models/${model.model_display_name}`}
						>
							{isPinned && (
								<span className="absolute top-1 right-2" title="Pinned model">
									📌
								</span>
							)}
							<div className="-mb-1 flex items-center">
								{authorInfo?.logo ? (
									<img
										className="mr-2 block w-6"
										src={authorInfo.logo}
										alt={`${authorInfo.name} logo`}
									/>
								) : (
									<div className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-sm font-black text-gray-400 uppercase">
										{author.slice(0, 1)}
									</div>
								)}
								<span className="overflow-hidden text-lg font-semibold text-ellipsis whitespace-nowrap">
									{model.model_display_name}
								</span>
								{isBeta && <span className="sl-badge caution ml-1">Beta</span>}
							</div>
							<div className="m-0! text-xs">
								<ModelInfo model={model.model} />
							</div>
							<p className="mt-2! line-clamp-2 text-sm leading-6">
								{model.model.description}
							</p>
							<div className="mt-2! text-xs">
								<ModelBadges model={model.model} />
							</div>
						</a>
					);
				})}
			</div>
		</div>
	);
};

export default ModelCatalog;
