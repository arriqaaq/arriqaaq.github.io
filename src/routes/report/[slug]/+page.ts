import { error } from '@sveltejs/kit';
import { reports, getReport } from '$lib/content';

export const prerender = true;

export function entries() {
	return reports.map((r) => ({ slug: r.slug }));
}

export function load({ params }) {
	const report = getReport(params.slug);
	if (!report) throw error(404, 'Report not found');
	return {
		report,
		breadcrumb: report.title
	};
}
