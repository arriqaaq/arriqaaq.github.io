export type Author = {
	id: string;
	slug: string;
	name: string;
	bio: string | null;
	profile_image: string | null;
	cover_image: string | null;
	website: string | null;
	twitter: string | null;
};

export type Tag = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	feature_image: string | null;
	post_count: number;
};

export type Post = {
	id: string;
	uuid: string;
	type: 'post' | 'page';
	slug: string;
	title: string;
	html: string;
	plaintext: string;
	feature_image: string | null;
	custom_excerpt: string | null;
	published_at: string;
	updated_at: string;
	reading_time: number;
	featured: boolean;
	visibility: string;
	show_title_and_feature_image: boolean;
	custom_template: string | null;
	tags: string[];
	primary_tag: string | null;
	authors: string[];
	primary_author: string | null;
};

export type SiteSettings = {
	title: string;
	description: string;
	logo: string | null;
	icon: string | null;
	cover_image: string | null;
	navigation: { label: string; url: string; mobile?: boolean }[];
	secondary_navigation: { label: string; url: string; mobile?: boolean }[];
};

export type ReportTheme = 'light' | 'dark';
export type ReportCardKind = 'cover' | 'post';

export type ReportCard = {
	kind: ReportCardKind;
	post: Post | null;
	title: string | null;
	eyebrow: string | null;
	excerpt: string | null;
	permalink: string | null;
	feature_image: string | null;
	bg: string;
	theme: ReportTheme;
	share: boolean;
	rotation: number;
	hash: string | null;
};

export type ReportChapter = {
	id: string;
	title: string;
	nav_label: string;
	nav_icon: string | null;
	nav_index: number | null;
	bg: string;
	theme: ReportTheme;
	tag: string | null;
	show_in_stepper: boolean;
	cards: ReportCard[];
};

export type Report = {
	slug: string;
	title: string;
	subtitle: string | null;
	published: string;
	cover_image: string | null;
	press_kit_url: string | null;
	chapters: ReportChapter[];
};
