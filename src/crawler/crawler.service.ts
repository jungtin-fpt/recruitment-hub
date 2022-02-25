import { synchronizeJobs } from '../job/job.service';
import logger from '../logger';
import { createSection } from '../section/section.service';
import { synchronizeSkills } from '../skill-suggestor/skill.service';
import TopCVCrawler from './topcv.crawler';

export const topCvCrawler = new TopCVCrawler();
/* 
	Mỗi một crawler sẽ sử dụng theo crawler.then().catch()
*/
export async function startCrawling(keyword: string) {
	const section = await createSection(keyword);
	topCvCrawler
		.crawl(keyword, false)
		.then(async (topCvJobs) => {
			topCvCrawler.log('info', `Crawl Finished - keyword: ${keyword}`);
			topCvCrawler.log('info', `Synchonizing jobs...`);
			await synchronizeJobs(topCvJobs, section);
			topCvCrawler.log('info', `Finished synchonizing jobs`);
			topCvCrawler.log('info', `Synchonizing skills...`);
			const descriptions = topCvJobs.map((job) => job.description);
			synchronizeSkills(descriptions);
			topCvCrawler.log('info', `Finished synchonizing skills`);
		})
		.catch((err) => {
			logger.error(err);
			topCvCrawler.log('error', `TopCV Crawler - Process can't be finish due to error happen`);
		});

}
