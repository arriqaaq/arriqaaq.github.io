import {
	PUBLIC_GISCUS_REPO,
	PUBLIC_GISCUS_REPO_ID,
	PUBLIC_GISCUS_CATEGORY,
	PUBLIC_GISCUS_CATEGORY_ID
} from '$env/static/public';

export const GISCUS = {
	repo: PUBLIC_GISCUS_REPO || '',
	repoId: PUBLIC_GISCUS_REPO_ID || '',
	category: PUBLIC_GISCUS_CATEGORY || 'General',
	categoryId: PUBLIC_GISCUS_CATEGORY_ID || ''
};
