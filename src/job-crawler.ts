import puppeteer, { Browser, Page } from 'puppeteer';
import logger from './logger';
import { Company } from './model/company';
import { Job } from './model/job';
import { JobDetail } from './model/job-detail';
export async function launchBrowser(
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
			args: [`--window-size=${windowWidth},${windowHeight}`],
		});
		const context = browser.defaultBrowserContext();
		context.overridePermissions(baseUrl, ['geolocation', 'notifications']);
		return browser;
	} catch (err) {
		logger.error(err);
		throw new Error('Fail to launch browser');
	}
}

export async function goto(browser: Browser, url: string, page?: Page): Promise<Page> {
	try {
		if (!page) page = await browser.newPage();
		await page.goto(url, { waitUntil: 'networkidle2' });
		return page;
	} catch (err) {
		logger.error(err);
		throw new Error(`Fail to goto page: ${url}`);
	}
}

export async function search(page: Page, keyword: string): Promise<Page> {
	try {
		await page.waitForSelector('input#keyword');
		await page.type('input#keyword', keyword);
		await page.keyboard.press('Enter');
		return page;
	} catch (err) {
		logger.error(err);
		throw new Error(`Fail to search: ${keyword}`);
	}
}

export async function getTotalPageNumber(page: Page): Promise<number> {
	try {
		await page.waitForSelector('div.job-item');
		const pagination = await page.$('ul.pagination');
		if (pagination) {
			const listItems = await pagination.$$('li');
			const lastPageEl = listItems[listItems.length - 2];
			return Number.parseInt(await lastPageEl.evaluate((el) => (el as HTMLElement).innerText));
		}

		return 1;
	} catch (err) {
		logger.error(err);
		throw new Error(`Fail to get total page number`);
	}
}

export async function crawlAllJobs(page: Page, totalPage?: number): Promise<Job[]> {
	try {
		let isNextPage = false;
		const arrJobs: Job[] = [];
		let currentPage: string | undefined;
		do {
			await page.waitForSelector('div.job-item');
			const pagination = await page.$('ul.pagination');

			if (!pagination) logger.info('Page: 1(No pagination) processing...');
			else {
				const currentPageEl = await pagination.$('li.active span');
				currentPage = await currentPageEl?.evaluate((el) => (el as HTMLElement).innerText);
				logger.info(`Page: ${currentPage}/${totalPage || '_'} processing...`);
			}

			const jobs = await page.$$('div.job-item');
			logger.info(`Page ${currentPage} - Total: ${jobs.length} jobs`);

			const jobInfos = await Promise.all(
				jobs.map(async (job) => {
					const jobInfo = await job.evaluate((el) => {
						const titleEl = el.querySelector('h3.title');
						const url =
							(titleEl?.querySelector('a.underline-box-job') as HTMLElement).getAttribute('href') ||
							'';
						const title =
							(titleEl?.querySelector('span.transform-job-title') as HTMLElement).getAttribute(
								'data-original-title'
							) || '';
						// return new Job(url, title);
						return { url, title } as Job;
					});
					// logger.info(jobInfo);
					return jobInfo;
				})
			);

			arrJobs.push(...jobInfos);

			let nextPageEl;
			if (pagination) {
				nextPageEl = await pagination.$('li:last-child');
				if (!nextPageEl) throw new Error('Không tìm thấy next page');

				isNextPage = !(await nextPageEl.evaluate((el) => el.classList.contains('disabled')));
			}

			if (isNextPage && nextPageEl) await nextPageEl.click();
			// else await page.close();
		} while (isNextPage);

		return arrJobs;
	} catch (err) {
		logger.error(err);
		throw new Error(`Fail to crawl all jobs`);
	}
}

export async function crawlJobDetail(page: Page, job: Job): Promise<JobDetail> {
	try {
		await page.waitForSelector('h1.job-title');
		const companyLink =
			(await page.$eval('div.company-title a', (el) => (el as HTMLElement).getAttribute('href'))) ||
			'';
		const regionRaw = await page.$eval('div.area span a', (el) => (el as HTMLElement).innerText);
		const workAddress = await page.$eval(
			'div.box-address div div:nth-child(2)',
			(el) => (el as HTMLElement).innerText
		);
		const rawSalary =
			(await page.$$eval('div.box-item div strong', (els) => {
				const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Mức lương')[0];
				return el.parentNode?.querySelector('span')?.innerText;
			})) || '';
		const level =
			(await page.$$eval('div.box-item div strong', (els) => {
				const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Cấp bậc')[0];
				return el.parentNode?.querySelector('span')?.innerText;
			})) || '';
		const requiredExp =
			(await page.$$eval('div.box-item div strong', (els) => {
				const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Kinh nghiệm')[0];
				return el.parentNode?.querySelector('span')?.innerText;
			})) || '';

		await page.goto(companyLink);
		await page.waitForSelector('h1.company-detail-name');
		const companyName = await page.$eval(
			'h1.company-detail-name',
			(el) => (el as HTMLElement).innerText
		);
		const companyAddress = await page.$eval(
			'div.box-address p',
			(el) => (el as HTMLElement).innerText
		);
		const companyImageUrl =
			(await page.$eval('div.company-image-logo img', (el) =>
				(el as HTMLElement).getAttribute('src')
			)) || '';
		// await page.close();

		const company = new Company(companyLink, companyName, companyAddress, companyImageUrl);
		return new JobDetail(
			job.url,
			job.title,
			regionRaw,
			workAddress,
			level,
			requiredExp,
			rawSalary,
			company
		);
	} catch (err) {
		logger.error(err);
		throw new Error(`Fail to crawl job detail: ${job.title} - ${job.url}`);
	}
}

export async function crawlJobDetailForBrandPage(page: Page, job: Job) {
	try {
		await page.waitForSelector('div#company-name');
		const companyLink =
			(await page.$eval('ul#nav-list-item li:first-child a', (el) =>
				(el as HTMLElement).getAttribute('href')
			)) || '';
		const regionRaw = await page.$eval(
			'div.box-address div div:first-child',
			(el) => (el as HTMLElement).innerText
		);
		const workAddress = await page.$eval(
			'div.box-address div div:nth-child(2)',
			(el) => (el as HTMLElement).innerText
		);
		const rawSalary =
			(await page.$$eval('div.box-item div strong', (els) => {
				const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Mức lương')[0];
				return el.parentNode?.querySelector('span')?.innerText;
			})) || '';
		const level =
			(await page.$$eval('div.box-item div strong', (els) => {
				const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Cấp bậc')[0];
				return el.parentNode?.querySelector('span')?.innerText;
			})) || '';
		const requiredExp =
			(await page.$$eval('div.box-item div strong', (els) => {
				const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Kinh nghiệm')[0];
				return el.parentNode?.querySelector('span')?.innerText;
			})) || '';

		await page.goto(companyLink);
		await page.waitForSelector('div#company-name');
		const companyName = await page.$eval(
			'div#company-name h1',
			(el) => (el as HTMLElement).innerText
		);
		const companyAddress = await page.$eval(
			'div.content-contact div.info-line:nth-child(3) span',
			(el) => (el as HTMLElement).innerText
		);
		const companyImageUrl =
			(await page.$eval('div#company-logo img', (el) => (el as HTMLElement).getAttribute('src'))) ||
			'';
		// await page.close();

		const company = new Company(companyLink, companyName, companyAddress, companyImageUrl);
		return new JobDetail(
			job.url,
			job.title,
			regionRaw.replace('- Khu vực:', ''),
			workAddress.slice(2, -1),
			level,
			requiredExp,
			rawSalary,
			company
		);
	} catch (err) {
		logger.error(err);
		throw new Error(`Fail to crawl job detail for brand name: ${job.title} - ${job.url}`);
	}
}
