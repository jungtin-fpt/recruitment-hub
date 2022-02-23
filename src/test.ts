import { TopCVCrawler } from "./crawler/topcv-job-crawler";

(async () => {
	const topCvCrawler = new TopCVCrawler();
	const jobs =  await topCvCrawler.crawl("java", false);
	console.log(jobs);
})();
