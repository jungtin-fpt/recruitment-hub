import puppeteer, { Browser, Page } from 'puppeteer';
import { CompanyDTO } from '../company/company.dto';
import { JobDetailCareerBuilderDTO } from '../job/job-detail-careerbuilder.dto';
import { JobDetailDTO } from '../job/job-detail.dto';
import { JobOverallDTO } from '../job/job-overall.dto';
import logger from '../logger';
import AbstractCrawler from './crawler.abstract';

export default class CareerBuilderCrawler extends AbstractCrawler {
    async crawl(
		keyword: string,
		headless: boolean = true,
		baseUrl: string = 'https://careerbuilder.vn',
		searchUrl: string = 'https://careerbuilder.vn'
	): Promise<JobDetailDTO[]> {
		try {
			const jobDetails: JobDetailDTO[] = [];
            //
            var startTime = Date.now();
			this.log('info', `CareerBuilder Crawler: has just started and crawling for keyword: ${keyword} - URL: ${baseUrl}`);

            const browser = await this.launchBrowser(baseUrl, headless);
            let page = await this.goto(browser, `https://careerbuilder.vn/viec-lam/${keyword}-k-vi.html`);
            const jobs = await this.crawlAllJobs(page);
            //
			for (let i = 0; i < jobs.length; i++) {
				const job: JobOverallDTO = jobs[i];
				try {
					page = await this.goto(browser, job.url, page);
					let detail!: JobDetailDTO;
					detail = await this.crawlJobDetail(page, job, keyword);
		
					if (detail) {
						this.log('info', 'Job crawling completed successfully:');
						this.log('info', detail);
						jobDetails.push(detail);
					}
				} catch (err) {
					this.log('error', `CareerBuilder Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
				}
			}
			await browser.close();
			var endTime = Date.now();
			this.log('info', `Crawling process comleted in ${Math.round((endTime - startTime) / 1000)} seconds `);
			//
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
			throw new Error('CareerBuilder Crawler - Fail to launch browser');
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
			throw new Error(`CareerBuilder Crawler - Fail to goto page: ${url}`);
		}
	}

    async crawlAllJobs(page: Page): Promise<JobOverallDTO[]> {
		try {
			let isNextPage = false;
			const arrJobs: JobOverallDTO[] = [];
			let currentPage: string | undefined;

			const isEmptyEl = await page.$('div.no-search');
			if (!!isEmptyEl) {
				this.log('info', `Crawl All Job - There's no result that match with your keyword`);
				return [];
			}

			do {
				await page.waitForSelector('div.job-item');
				const pagination = await page.$('div.pagination');

				if (!pagination) this.log('info', `Crawl All Job - Page: 1(No pagination) processing...`);
				else {
					const currentPageEl = await pagination.$('li.active a');
					currentPage = await currentPageEl?.evaluate((el) => (el as HTMLElement).innerText);
				}

				const jobs = await page.$$('div.job-item');
				this.log('info', `Crawl All Job - Page ${currentPage} - Total: ${jobs.length} jobs`);

				const jobInfos = await Promise.all(
					jobs.map(async (job) => {
						const jobInfo = await job.evaluate((el) => {
							const wrapperEl = el.querySelector('div.title');
							const urlEl = wrapperEl?.querySelector('a.job_link');
							const titleEl = wrapperEl?.querySelector('a.job_link');

							const url = urlEl ? urlEl.getAttribute('href') : '';
							const title = titleEl ? titleEl.getAttribute('title') : '';

							return { url, title } as JobOverallDTO;
						});
						this.log('info', jobInfo);
						return jobInfo;
					})
				);

				arrJobs.push(...jobInfos);

				let nextPageEl;
				if (pagination) {
					nextPageEl = await pagination.$('li:last-child');
					if (!nextPageEl) throw new Error('Không tìm thấy next page');

					isNextPage = (await nextPageEl.evaluate((el) => el.classList.contains('next-page')));
				}

				if (isNextPage && nextPageEl) await nextPageEl.click();
				// else await page.close();
			} while (isNextPage);

			return arrJobs;
		} catch (err) {
			logger.error(err);
			this.log('error', `CareerBuilder Crawler - Fail to crawl all jobs`, true);
			throw new Error(`CareerBuilder Crawler - Fail to crawl all jobs`);
		}
	}

	async crawlJobDetail(page: Page, job: JobOverallDTO, keyword: string): Promise<JobDetailDTO> {
		try {
			await page.waitForSelector('h1.title');
			const companyLink =
				(await page.$eval('body > main > section.search-result-list-detail.template-2 > div > div > div.col-12.mb-15 > section > div.apply-now-content > div.job-desc > a', (el) =>
					(el as HTMLElement).getAttribute('href')
				)) || '';
			const region = await page.$eval('#tab-1 > section > div.bg-blue > div > div:nth-child(1) > div > div > p > a', (el) => (el as HTMLElement).innerText);
			const workAddress = region;
			const salary = await page.$eval('#tab-1 > section > div.bg-blue > div > div:nth-child(3) > div > ul > li:nth-child(1) > p', (el) => (el as HTMLElement).innerText);
			const level = await page.$eval('#tab-1 > section > div.bg-blue > div > div:nth-child(3) > div > ul > li:nth-child(3) > p', (el) => (el as HTMLElement).innerText);
			const workMethod = await page.$eval('#tab-1 > section > div.bg-blue > div > div:nth-child(2) > div > ul > li:nth-child(3) > p', (el) => (el as HTMLElement).innerText);
			const skills:string[] = [keyword];
			// const description = '';
			const description = 
				(await page.$$eval('h3.detail-title', (els) => {
					const el = (els as HTMLElement[]).filter(
						(title) => title.innerHTML === 'Yêu Cầu Công Việc'
					)[0];
					const contentTabEl = el.nextElementSibling;
					const items = contentTabEl?.querySelectorAll('li');
					const paragraphItems = contentTabEl?.querySelectorAll('strong');
					let description = '';
					items?.forEach((item) => {
						description += ` ${item.textContent} `;
					});
					paragraphItems?.forEach((item) => {
						description += ` ${item.textContent} `;
					});
					return description;
				})) || '';

			// const descEl = await page.$$eval('h3.detail-title', els => {
			// 	const el = (els as HTMLElement[]).filter(
			// 		(title) => title.innerText === 'Yêu Cầu Công Việc'
			// 	);
			// 	// return el.innerText;
			// 	return els.map(el => el.innerHTML);
			// });
			// console.log(descEl);
			


			const requiredExp = await page.$eval('#tab-1 > section > div.bg-blue > div > div:nth-child(3) > div > ul > li:nth-child(2) > p', (el) => (el as HTMLElement).innerText);

			const company = await this.crawlCompany(page, companyLink);
			const jobDetailRaw = new JobDetailCareerBuilderDTO(
				job.url,
				job.title,
				description,
				region,
				salary,
				workMethod,
				workAddress,
				level,
				skills,
				company,
				requiredExp
			);
			return jobDetailRaw.reformat();
		} catch (err) {
			logger.error(err);
			this.log('error', `CareerBuilder Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`, true);
			throw new Error(`CareerBuilder Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
		}
	}

	async crawlCompany(page: Page, companyLink: string): Promise<CompanyDTO> {
		try {
			await page.goto(companyLink);
			await page.waitForSelector('body > main > section > div > div.company-introduction > div.company-info > div > div.content > p.name');
			const companyName = await page.$eval(
				'body > main > section > div > div.company-introduction > div.company-info > div > div.content > p.name',
				(el) => (el as HTMLElement).innerText
			);
			const companyAddress = await page.$eval(
				'body > main > section > div > div.company-introduction > div.company-info > div > div.content > p:nth-child(3)',
				(el) => (el as HTMLElement).innerText
			);
			const companyImageUrl =
				(await page.$eval('body > main > section > div > div.company-introduction > div.company-info > div > div.img > img', (el) =>
					(el as HTMLElement).getAttribute('src')
				)) || '';
			// await page.close();

			return new CompanyDTO(companyLink, companyName, companyAddress, companyImageUrl);
		} catch (err) {
			logger.error(err);
			this.log('error', `CareerBuilder Crawler - Fail to crawl company: ${companyLink}`, true);
			throw new Error(`CareerBuilder Crawler - Fail to crawl company: ${companyLink}`);
		}
	}

	async getWorkAddress(page: Page) {
		try {
			const address = await page.$('#tab-1 > section > div.bg-blue > div > div:nth-child(1) > div > div > a > img');
			address?.click;
			
			return await page.$eval('#maps-tab-1 > div.box-local > div.content > ul > li > a', (el) => (el as HTMLElement).innerText);
		} catch (err) {
			logger.error(err);
			throw new Error(`CareerBuilder Crawler - Fail to crawl address`);
		}
	}
}