const links = [{ label: "Productos", href: "/products/" }];

export default function HeaderDropdownsComponent() {
	return (
		<div className="flex gap-2 leading-6 text-nowrap">
			{links.map(({ label, href }) => (
				<a
					key={href}
					href={href}
					className="hover:bg-cl1-white dark:hover:bg-cl1-gray-0 flex items-center justify-center rounded-sm p-2 font-medium text-black no-underline hover:shadow-md"
				>
					{label}
				</a>
			))}
		</div>
	);
}
