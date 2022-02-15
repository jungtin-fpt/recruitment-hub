import {
	launchBrowser,
	goto,
	search,
	getTotalPageNumber,
	crawlAllJobs,
	crawlJobDetail,
	crawlJobDetailForBrandPage,
} from './job-crawler';
import logger from './logger';
const { performance } = require('perf_hooks');

(async () => {
	try {
		var startTime = performance.now();
		const BASE_URL = 'https://www.topcv.vn';
		const SEARCH_URL = 'https://www.topcv.vn/viec-lam';
		const browser = await launchBrowser(BASE_URL, true);
		let page = await goto(browser, SEARCH_URL);
		page = await search(page, 'java');
		const totalPage = await getTotalPageNumber(page);
		const jobs = await crawlAllJobs(page, totalPage);
		for (let i = 0; i < jobs.length; i++) {
			const job = jobs[i];
			page = await goto(browser, job.url, page);
			if (job.url.includes('topcv.vn/viec-lam')) {
				const detail = await crawlJobDetail(page, job);
				console.log(detail);
			} else if (job.url.includes('topcv.vn/brand')) {
				const detail = await crawlJobDetailForBrandPage(page, job);
				console.log(detail);
			}
		}
		var endTime = performance.now();
		console.log(`Call to doSomething took ${endTime - startTime} milliseconds`);
	} catch (err) {
		logger.error(err);
	}
})();
