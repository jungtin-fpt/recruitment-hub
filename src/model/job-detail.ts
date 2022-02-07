import { Company } from './company';
import { Job } from './job';

export class JobDetail extends Job {
	constructor(
		url: string,
		title: string,
		public regionRaw: string,
		public workAddress: string,
		public level: string,
		public requiredExp: string,
		public salaryRaw: string,
		public company: Company
	) {
		super(url, title);
	}
}
