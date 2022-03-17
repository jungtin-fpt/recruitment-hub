import puppeteer, { Browser, Page } from 'puppeteer';
import { CompanyDTO } from '../company/company.dto';
import { JobDetailTopCvDTO } from '../job/job-detail-topcv.dto';
import { JobDetailDTO } from '../job/job-detail.dto';
import { JobOverallDTO } from '../job/job-overall.dto';
import logger from '../logger';
import AbstractCrawler from './crawler.abstract';

export default class TopCVCrawler extends AbstractCrawler {
	async crawl(
		keyword: string,
		headless: boolean = true,
		baseUrl: string = 'https://www.topcv.vn',
		searchUrl: string = 'https://www.topcv.vn/viec-lam'
	): Promise<JobDetailDTO[]> {
		try {
			const jobDetails: JobDetailDTO[] = [];
			var startTime = Date.now();
			this.log('info', `TopCV Crawler: has just started and crawling for keyword: ${keyword} - URL: ${baseUrl}`);
			
			const browser = await this.launchBrowser(baseUrl, headless);
			let page = await this.goto(browser, searchUrl);
			page = await this.search(page, keyword);
			const totalPage = await this.getTotalPageNumber(page);
			const jobs = await this.crawlAllJobs(page, totalPage);
			for (let i = 0; i < jobs.length; i++) {
				const job: JobOverallDTO = jobs[i];
				try {
					page = await this.goto(browser, job.url, page);
					let detail!: JobDetailDTO;
					if (job.url.includes('topcv.vn/viec-lam')) detail = await this.crawlJobDetail(page, job);
					else if (job.url.includes('topcv.vn/brand'))
						detail = await this.crawlJobDetailForBrandPage(page, job);

					if (detail) {
						this.log('info', 'Job crawling completed successfully:');
						this.log('info', detail);
						jobDetails.push(detail);
					}
				} catch (err) {
					this.log('error', `TopCV Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
				}
			}
			await browser.close();
			var endTime = Date.now();
			this.log('info', `Crawling process comleted in ${Math.round((endTime - startTime) / 1000)} seconds `);
			return jobDetails;
		} catch (err) {
			logger.error(err);
			throw new Error(`Error when crawling website: ${baseUrl} - ${searchUrl}`);
		}
	}

	/* 
	Ý nghĩa: Dùng để khởi tạo browser (*cần được chạy trước tất cả những function khác)
	- headless: Hiển thị browser khi crawl (*tốc độ sẽ chậm hơn, đôi khi gặp lỗi)
	- devtools: Hiển thị devtools khi crawl (*tác dụng khi headless: true)
*/
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
			throw new Error('TopCV Crawler - Fail to launch browser');
		}
	}

	/* 
		Ý nghĩa: Chuyển hướng đến url mới
		- (waitUntil: 'networkidle2'): Chờ đến khi redirect action đã fully hoàn tất thì mới tiếp tục
		+ tránh tình trạng page chưa load xong -> null element 
	*/
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

	/* 
		Ý nghĩa: Dùng để search keyword
	*/

	async search(page: Page, keyword: string): Promise<Page> {
		try {
			await page.waitForSelector('input#keyword');
			await page.type('input#keyword', keyword);
			await page.keyboard.press('Enter');

			this.log('info', `Searching: ${keyword}`);
			return page;
		} catch (err) {
			logger.error(err);
			throw new Error(`TopCV Crawler - Fail to search: ${keyword}`);
		}
	}

	/* 
		Ý nghĩa: Dùng để lấy tổng số page trong pagination
	*/
	async getTotalPageNumber(page: Page): Promise<number> {
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
			throw new Error(`TopCV Crawler - Fail to get total page number`);
		}
	}

	/* 
		Ý nghĩa: Tiến hành cào thông tin cơ bản của mỗi job(*nếu không có job phù hợp -> return empty list)
		Bước 1: Xác định có job phù hợp với keyword
		Bước 2: Duyệt tất cả job của page hiện tại
		Bước 3: Chuyển trang(*if current page is not last page)
		Bước 4: Thực hiện lại bước 2 & return nếu đã chạm last page
	*/
	async crawlAllJobs(page: Page, totalPage?: number): Promise<JobOverallDTO[]> {
		try {
			let isNextPage = false;
			const arrJobs: JobOverallDTO[] = [];
			let currentPage: string | undefined;

			const isEmptyEl = await page.$('div.list-empty');
			if (!!isEmptyEl) {
				this.log('info', `Crawl All Job - There's no result that match with your keyword`);
				return [];
			}

			do {
				await page.waitForSelector('div.job-item');
				const pagination = await page.$('ul.pagination');

				if (!pagination) this.log('info', `Crawl All Job - Page: 1(No pagination) processing...`);
				else {
					const currentPageEl = await pagination.$('li.active span');
					currentPage = await currentPageEl?.evaluate((el) => (el as HTMLElement).innerText);
					this.log('info', `Page: ${currentPage}/${totalPage || '_'} processing...`);
				}

				const jobs = await page.$$('div.job-item');
				this.log('info', `Crawl All Job - Page ${currentPage} - Total: ${jobs.length} jobs`);

				const jobInfos = await Promise.all(
					jobs.map(async (job) => {
						const jobInfo = await job.evaluate((el) => {
							const wrapperEl = el.querySelector('h3.title');
							const urlEl = wrapperEl?.querySelector('a.underline-box-job');
							const titleEl = wrapperEl?.querySelector('span.transform-job-title');

							const url = urlEl ? urlEl.getAttribute('href') : '';
							const title = titleEl ? titleEl.getAttribute('data-original-title') : '';

							// return new Job(url, title);
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

					isNextPage = !(await nextPageEl.evaluate((el) => el.classList.contains('disabled')));
				}

				if (isNextPage && nextPageEl) await nextPageEl.click();
				// else await page.close();
			} while (isNextPage);

			return arrJobs;
		} catch (err) {
			logger.error(err);
			this.log('error', `TopCV Crawler - Fail to crawl all jobs`, true);
			throw new Error(`TopCV Crawler - Fail to crawl all jobs`);
		}
	}

	/* 
		Ý nghĩa: Dùng để cào data của từng job cụ thể
		- Main function sẽ redirect đến từng Job's URL và truyền thông tin vào đây
		Ở đây sẽ thực hiện trích xuất thông tin và return JobDetail
	*/
	async crawlJobDetail(page: Page, job: JobOverallDTO): Promise<JobDetailDTO> {
		try {
			await page.waitForSelector('h1.job-title');
			const companyLink =
				(await page.$eval('div.company-title a', (el) =>
					(el as HTMLElement).getAttribute('href')
				)) || '';
			const region = await page.$eval('div.area span a', (el) => (el as HTMLElement).innerText);
			const workAddress = await page.$eval(
				'div.box-address div div:nth-child(2)',
				(el) => (el as HTMLElement).innerText
			);
			const salary =
				(await page.$$eval('div.box-item div strong', (els) => {
					const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Mức lương')[0];
					return el.parentNode?.querySelector('span')?.innerText;
				})) || '';
			const level =
				(await page.$$eval('div.box-item div strong', (els) => {
					const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Cấp bậc')[0];
					return el.parentNode?.querySelector('span')?.innerText;
				})) || '';
			const workMethod =
				(await page.$$eval('div.box-item div strong', (els) => {
					const el = (els as HTMLElement[]).filter(
						(title) => title.innerText === 'Hình thức làm việc'
					)[0];
					return el.parentNode?.querySelector('span')?.innerText;
				})) || '';
			const skills = await page.$$eval('div.skill span', (els) => {
				return (els as HTMLElement[])
					.filter((el) => {
						return !!el.querySelector('a')?.innerText;
					})
					.map((el) => {
						return el.querySelector('a')?.innerText || '';
					});
			});
			const description =
				(await page.$$eval('div.job-data h3', (els) => {
					const el = (els as HTMLElement[]).filter(
						(title) => title.innerText === 'Yêu cầu ứng viên'
					)[0];
					const contentTabEl = el.nextElementSibling;
					const items = contentTabEl?.querySelectorAll('ul li');
					const paragraphItems = contentTabEl?.querySelectorAll('p');
					let description = '';
					items?.forEach((item) => {
						description += ` ${item.textContent} `;
					});
					paragraphItems?.forEach((item) => {
						description += ` ${item.textContent} `;
					});
					return description;
				})) || '';
			const requiredExp =
				(await page.$$eval('div.box-item div strong', (els) => {
					const el = (els as HTMLElement[]).filter((title) => title.innerText === 'Kinh nghiệm')[0];
					return el.parentNode?.querySelector('span')?.innerText;
				})) || '';

			// console.log(`Job title: ${job.title}`);
			// console.log(`Job link: ${job.url}`);
			// console.log(`Company link: ${companyLink}`);
			// console.log(`Raw region: ${rawRegion}`);
			// console.log(`Work address: ${workAddress}`);
			// console.log(`Raw salary: ${rawSalary}`);
			// console.log(`Level: ${rawLevel}`);
			// console.log(`Work method: ${rawWorkMethod}`);
			// console.log(`Skills: ${skills.length}`);
			// skills.forEach(skill => {
			// 	console.log(skill);
			// })
			// console.log(`Description: ${description}`);
			const company = await this.crawlCompany(page, companyLink);
			const jobDetailRaw = new JobDetailTopCvDTO(
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
			this.log('info',jobDetailRaw.reformat());
			return jobDetailRaw.reformat();
		} catch (err) {
			logger.error(err);
			this.log('error', `TopCV Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`, true);
			throw new Error(`TopCV Crawler - Fail to crawl job detail: ${job.title} - ${job.url}`);
		}
	}

	/* 
		Ý nghĩa: Nhiệm vụ thằng này giống 100% thằng crawlJobDetail
		Nhưng vì website: topcv nó có 2 kiểu page nên là mình tạo cái này để riêng thôi
	*/
	async crawlJobDetailForBrandPage(page: Page, job: JobOverallDTO): Promise<JobDetailDTO> {
		try {
			await page.waitForSelector('div#company-name');
			const companyLink =
				(await page.$eval('ul#nav-list-item li:first-child a', (el) =>
					(el as HTMLElement).getAttribute('href')
				)) || '';
			const region = await page.$eval(
				'div.box-address div div:first-child',
				(el) => (el as HTMLElement).innerText
			);
			const workAddress = await page.$eval(
				'div.box-address div div:nth-child(2)',
				(el) => (el as HTMLElement).innerText
			);
			const salary =
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

			const workMethod =
				(await page.$$eval('div.box-item div strong', (els) => {
					const el = (els as HTMLElement[]).filter(
						(title) => title.innerText === 'Hình thức làm việc'
					)[0];
					return el.parentNode?.querySelector('span')?.innerText;
				})) || '';
			const skills = await page.$eval('div.job-detail-section div.section-body', (el) => {
				const elements = Array.from(el.querySelectorAll('h4')).filter(
					(el) => el.textContent === 'Kỹ năng'
				);
				if (elements.length === 0) return [];

				const items: string[] = [];
				elements[0].parentNode?.querySelectorAll('span').forEach((el) => {
					items.push(el.textContent?.trim() || '');
				});
				return items;
			});
			const description =
				(await page.$$eval('div.job-data h2	', (els) => {
					const el = (els as HTMLElement[]).filter(
						(title) => title.innerText === 'Yêu cầu ứng viên'
					)[0];
					const contentTabEl = el.nextElementSibling;
					const items = contentTabEl?.querySelectorAll('ul li');
					const paragraphItems = contentTabEl?.querySelectorAll('p');
					let description = '';
					items?.forEach((item) => {
						description += ` ${item.textContent} `;
					});
					paragraphItems?.forEach((item) => {
						description += ` ${item.textContent} `;
					});
					return description;
				})) || '';

			// console.log(`Job title: ${job.title}`);
			// console.log(`Job link: ${job.url}`);
			// console.log(`Company link: ${companyLink}`);
			// console.log(`Raw region: ${region}`);
			// console.log(`Work address: ${workAddress}`);
			// console.log(`Raw salary: ${salary}`);
			// console.log(`Level: ${level}`);
			// console.log(`Work method: ${workMethod}`);
			// console.log(`Skills: ${skills}`);
			// console.log(`Skills: ${skills.length}`);
			// skills.forEach((skill) => {
			// 	console.log(skill);
			// });
			// console.log(`Description: ${description}`);
			// console.log(`Company: ${company}`);

			const company = await this.crawlCompanyForBrandPage(page, companyLink);
			const jobDetailRaw = new JobDetailTopCvDTO(
				job.url,
				job.title,
				description,
				region.replace('- Khu vực:', ''),
				salary,
				workMethod,
				workAddress.slice(2, -1),
				level,
				skills,
				company,
				requiredExp
			);
			return jobDetailRaw.reformat();
		} catch (err) {
			logger.error(err);
			this.log('error', `TopCV Crawler - Fail to crawl job detail for brand name: ${job.title} - ${job.url}`, true);
			throw new Error(`TopCV Crawler - Fail to crawl job detail for brand name: ${job.title} - ${job.url}`);
		}
	}

	async crawlCompany(page: Page, companyLink: string): Promise<CompanyDTO> {
		try {
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

			return new CompanyDTO(companyLink, companyName, companyAddress, companyImageUrl);
		} catch (err) {
			logger.error(err);
			this.log('error', `TopCV Crawler - Fail to crawl company: ${companyLink}`, true);
			throw new Error(`TopCV Crawler - Fail to crawl company: ${companyLink}`);
		}
	}

	async crawlCompanyForBrandPage(page: Page, companyLink: string): Promise<CompanyDTO> {
		try {
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
				(await page.$eval('div#company-logo img', (el) =>
					(el as HTMLElement).getAttribute('src')
				)) || '';

			return new CompanyDTO(companyLink, companyName, companyAddress, companyImageUrl);
		} catch (err) {
			logger.error(err);
			this.log('error', `TopCV Crawler - Fail to crawl company for brand page: ${companyLink}`, true);
			throw new Error(`TopCV Crawler - Fail to crawl company for brand page: ${companyLink}`);
		}
	}
}