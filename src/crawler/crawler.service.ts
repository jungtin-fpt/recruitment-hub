import { synchronizeJobs } from '../job/job.service';
import { SECTION_STATE } from '../job/utils/section-state';
import logger from '../logger';
import { createSection, updateSectionStatus } from '../section/section.service';
import { synchronizeSkills } from '../skill-suggestor/skill.service';
import AbstractCrawler from './crawler.abstract';
import TopCVCrawler from './topcv.crawler';
import DefaultEmitter from '../emitter/default-emitter';

export const topCvCrawler = new TopCVCrawler();
/* 
	Mỗi một crawler sẽ sử dụng theo crawler.then().catch()
*/
export let crawlers: AbstractCrawler[] = [topCvCrawler];
export let numOfFinishedJob = 0;

export let isAvailable = true;

export async function startCrawling(keyword: string) {
	isAvailable = false;
	DefaultEmitter.log('info', `Crawling process of keyword: ${keyword} is starting`);
	DefaultEmitter.status(isAvailable);
	const section = await createSection(keyword);
	for (const crawler of crawlers) {
		crawler
			.crawl(keyword, false)
			.then(async (jobs) => {
				crawler.log('info', `Crawl Finished - keyword: ${keyword}`);
				crawler.log('info', `Synchonizing jobs...`);
				await synchronizeJobs(jobs, section);
				crawler.log('info', `Finished synchonizing jobs`);
				crawler.log('info', `Synchonizing skills...`);
				const descriptions = jobs.map((job) => job.description);
				synchronizeSkills(descriptions);
				crawler.log('info', `Finished synchonizing skills`);
			})
			.catch((err) => {
				logger.error(err);
				crawler.log('error', `Process can't be finish due to error happen`);
			})
			.finally(async () => {
				if (++numOfFinishedJob >= crawlers.length) {
					numOfFinishedJob = 0;
					isAvailable = true;
					await updateSectionStatus(section.id, SECTION_STATE.COMPLETED);
					DefaultEmitter.log('info', `Crawling process of keyword: ${keyword} has been completed`);
					DefaultEmitter.status(isAvailable);
				}
			});
	}
}
