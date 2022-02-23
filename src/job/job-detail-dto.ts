import { CompanyDTO } from '../company/company-dto';
import { LEVEL } from './level';
import { WORK_METHOD } from './work-method';

export class JobDetailDTO {
	constructor(
		public url: string,
		public title: string,
		public description: string,
		public regionName: string,
		public regionNormalize: string,
		public workAddress: string,
		public workMethod: WORK_METHOD,
		public level: LEVEL,
		public skills: string[],
		public company: CompanyDTO,
		public requiredExp?: string,
		public salaryFrom?: number,
		public salaryTo?: number,
		) {}
}
