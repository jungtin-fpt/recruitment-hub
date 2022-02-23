import { JobDetailDTO } from '../job/job-detail-dto';

export interface ICrawler {
	crawl(
		keyword: string,
		headless: boolean,
		baseUrl: string,
		searchUrl: string
	): Promise<JobDetailDTO[]>;
}
