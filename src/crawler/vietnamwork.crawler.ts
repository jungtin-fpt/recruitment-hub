import puppeteer, { Browser, Page } from 'puppeteer';
import { CompanyDTO } from '../company/company.dto';
import { JobDetailVietnamWorkDTO } from '../job/job-detail-vietnamwork.dto';
import { JobDetailDTO } from '../job/job-detail.dto';
import { JobOverallDTO } from '../job/job-overall.dto';
import { WORK_METHOD } from '../job/utils/work-method';
import logger from '../logger';
import AbstractCrawler from './crawler.abstract';

export default class VietnamWorkCrawler extends AbstractCrawler {
	async crawl(
		keyword: string,
		headless: boolean = true,
		baseUrl: string = 'https://www.vietnamworks.com',
		searchUrl: string = 'https://www.vietnamworks.com'
	): Promise<JobDetailDTO[]> {
		try {
			const jobDetails: JobDetailDTO[] = [];
			var startTime = Date.now();
			this.log(
				'info',
				`VietnamWork Crawler: has just started and crawling for keyword: ${keyword} - URL: ${baseUrl}`
			);

			const browser = await this.launchBrowser(baseUrl, headless);
			let page = await browser.newPage();
			await page.goto(
				'https://secure.vietnamworks.com/login/vi?client_id=3&utm_source=&utm_medium=Header',
				{ waitUntil: 'networkidle2' }
			);
			await page.waitForSelector("input[name='username']");
			await (await page.$("input[name='username']"))?.type('tuanchau1008@gmail.com');
			await (await page.$("input[name='password']"))?.type('100800Tuan');
			await (await page.$('#button-login'))?.click();
			await page.waitForNavigation({
				waitUntil: 'networkidle2',
			});

			page = await this.goto(browser, searchUrl);
			page = await this.search(page, keyword);
			const jobs = await this.crawlAllJobs(page);

			for (let i = 0; i < jobs.length; i++) {
				const job: JobOverallDTO = jobs[i];
				try {
					page = await this.goto(browser, job.url, page);
					let detail!: JobDetailDTO;
					detail = await this.crawlJobDetail(page, job);

					if (detail) {
						this.log('info', 'Job crawling completed successfully:');
						this.log('info', detail);
						jobDetails.push(detail);
					}
				} catch (err) {
					this.log('error', `VietnamWork Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
				}
			}
			await browser.close();
			var endTime = Date.now();
			this.log(
				'info',
				`Crawling process comleted in ${Math.round((endTime - startTime) / 1000)} seconds `
			);
			return jobDetails;
		} catch (err) {
			logger.error(err);
			throw new Error(`Error when crawling website: ${baseUrl} - ${searchUrl}`);
		}
	}
	async launchBrowser(
		baseUrl: string,
		headless: boolean = false,
		windowWidth: number = 1200,
		windowHeight: number = 800
	): Promise<Browser> {
		try {
			const browser = await puppeteer.launch({
				headless,
				defaultViewport: null,
				devtools: false,
				args: [`--window-size=${windowWidth},${windowHeight}`, '--no-sandbox', '--disable-setuid-sandbox'],
			});
			const context = browser.defaultBrowserContext();
			context.overridePermissions(baseUrl, ['geolocation', 'notifications']);

			this.log('info', 'Opening browser');
			return browser;
		} catch (err) {
			logger.error(err);
			throw new Error('VietnamWork Crawler - Fail to launch browser');
		}
	}
	async goto(browser: Browser, url: string, page?: Page): Promise<Page> {
		try {
			if (!page) page = await browser.newPage();
			await page.goto(url, { waitUntil: 'networkidle2' });
			this.log('info', `Go to page: ${url}`);
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`TopDev Crawler - Fail to goto page: ${url}`);
		}
	}

	async search(page: Page, keyword: string): Promise<Page> {
		try {
			await page.waitForSelector('input#search-bar-input');
			await (await page.$('input#search-bar-input'))?.type(keyword);
			await page.keyboard.press('Enter');
			await page.waitForNavigation({
				waitUntil: 'networkidle2',
			});

			this.log('info', `Searching: ${keyword}`);
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`VietnamWork Crawler - Fail to search: ${keyword}`);
		}
	}
	async crawlAllJobs(page: Page, totalPage?: number): Promise<JobOverallDTO[]> {
		try {
			let isNextPage = false;
			const arrJobs: JobOverallDTO[] = [];
			let currentPage: string | undefined;

			const noResult = await page.$('div.noResultWrapper');
			if (noResult) {
				this.log('info', `Crawl All Job - There's no result that match with your keyword`);
				return [];
			}

			do {
				await page.waitForSelector('div.block-job-list');
				const pagination = await page.$('ul.pagination');

				if (!pagination) this.log('info', `Crawl All Job - Page: 1(No pagination) processing...`);
				else {
					const currentPageEl = await pagination.$('li.page-item.active');
					currentPage = await currentPageEl?.evaluate(
						(el) => (el as HTMLElement).querySelector('a.page-link')?.textContent || undefined
					);
					this.log('info', `Page: ${currentPage}/${totalPage || '_'} processing...`);
				}

				const jobs = await page.$$('div.job-info-wrapper');
				this.log('info', `Crawl All Job - Page ${currentPage} - Total: ${jobs.length} jobs`);

				const jobInfos = await Promise.all(
					jobs.map(async (job) => {
						const jobInfo = await job.evaluate((el) => {
							const titleEl = el?.querySelector('a.job-title');

							const url = titleEl
								? 'https://www.vietnamworks.com' + titleEl.getAttribute('href')
								: '';
							const title = titleEl ? titleEl.textContent : '';

							// return new Job(url, title);
							return { url, title } as JobOverallDTO;
						});
						this.log('info', jobInfo);
						return jobInfo;
					})
				);

				arrJobs.push(...jobInfos);

				if (pagination) {
					isNextPage = await pagination.$eval('li.page-item.active', (el) => {
						if (el.nextElementSibling) return true;
						return false;
					});
					if (isNextPage)
						(await pagination.$('li.page-item.active'))?.evaluate((el) => {
							const nextLink = el.nextElementSibling?.querySelector('a.page-link');
							if (nextLink) (nextLink as HTMLElement).click();
						});
					await page.waitForTimeout(500);
				}
				// else await page.close();
			} while (isNextPage);

			return arrJobs;
		} catch (err) {
			logger.error(err);
			this.log('error', `VietnamWork Crawler - Fail to crawl all jobs`, true);
			throw new Error(`VietnamWork Crawler - Fail to crawl all jobs`);
		}
	}
	async crawlJobDetail(page: Page, job: JobOverallDTO): Promise<JobDetailDTO> {
		try {
			await page.waitForSelector('h1.job-title');
			const companyLink =
				(await page.$eval('div.company-name a', (el) =>
					(el as HTMLElement).getAttribute('href')
				)) || '';
			const region = await page.$eval(
				'a[itemprop="address"]',
				(el) => (el as HTMLElement).innerText
			);
			const workAddress = await page.$eval(
				'.location-name.col-xs-11',
				(el) => (el as HTMLElement).innerText
			);
			const salary = await page.$eval('span.salary strong', (el) => (el as HTMLElement).innerText);
			const level =
				(await page.$$eval('span.content-label', (els) => {
					const el = (els as HTMLElement[]).filter((title) => title.innerHTML === 'Cấp Bậc')[0];
					return el.parentNode?.querySelector('span.content')?.textContent?.trim();
				})) || '';
			const workMethod = WORK_METHOD.FULL_TIME;
			const skills =
				(await page.$$eval('span.content-label', (els) => {
					const el = (els as HTMLElement[]).filter((title) => title.innerHTML === 'Kỹ Năng')[0];
					const content = el.parentNode?.querySelector('span.content')?.textContent?.trim();
					return content?.split(',').map((skill) => skill.trim());
				})) || [];
			const description =
				(await page.$eval('div.requirements', (el) => {
					return el.textContent;
				})) || '';

			// console.log(`Job title: ${job.title}`);
			// console.log(`Job link: ${job.url}`);
			// console.log(`Company link: ${companyLink}`);
			// console.log(`Raw region: ${region}`);
			// console.log(`Work address: ${workAddress}`);
			// console.log(`Raw salary: ${salary}`);
			// console.log(`Level: ${level}`);
			// console.log(`Work method: ${workMethod}`);
			// console.log(`Skills: ${skills.length}`);
			// skills.forEach(skill => {
			// 	console.log(skill);
			// })
			// console.log(`Description: ${description}`);

			const company = await this.crawlCompany(page, companyLink);
			const jobDetailRaw = new JobDetailVietnamWorkDTO 	(
				job.url,
				job.title,
				description,
				region,
				salary,
				workMethod,
				workAddress,
				level,
				skills,
				company
			);
			this.log('info', jobDetailRaw.reformat());
			return jobDetailRaw.reformat();
		} catch (err) {
			logger.error(err);
			this.log(
				'error',
				`VietnamWork Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`,
				true
			);
			throw new Error(`VietnamWork Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
		}
	}

	async crawlCompany(page: Page, companyLink: string): Promise<CompanyDTO> {
		try {
			await page.goto(companyLink);
			await page.waitForSelector('.col-12.col-lg-10.title');
			const companyName = await page.$eval(
				'.col-12.col-lg-10.title',
				(el) => (el as HTMLElement).innerText
			);
			const companyImageUrl =
				(await page.$eval('div.col-12.col-lg-2.logo a img', (el) =>
					(el as HTMLElement).getAttribute('src')
				)) || '';
			const companyAddress =
				(await page.$eval('div.headLine', (el) =>
					(el as HTMLElement).parentElement?.querySelector('.content')?.getAttribute('title')
				)) || '';
			// await page.close();

			return new CompanyDTO(companyLink, companyName, companyAddress, companyImageUrl);
		} catch (err) {
			logger.error(err);
			this.log('error', `VietnamWork Crawler - Fail to crawl company: ${companyLink}`, true);
			throw new Error(`VietnamWork Crawler - Fail to crawl company: ${companyLink}`);
		}
	}
}
