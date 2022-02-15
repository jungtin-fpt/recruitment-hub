import { Company } from './company-dto';
import { JobDTO } from './job-dto';

export class JobDetailDTO extends JobDTO {
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
