import { findOrCreateCompany } from '../company/company.service';
import { Job } from '../entity/Job';
import { Section } from '../entity/Section';
import { JobDetailDTO } from './job-detail.dto';

export async function synchronizeJobs(jobDtos: JobDetailDTO[], section: Section) {
	for await (const dto of jobDtos) {
		const company = await findOrCreateCompany(dto.company);
		const job = new Job(
			dto.url,
			dto.title,
			dto.level,
			dto.description,
			dto.regionName,
			dto.regionNormalize,
			dto.workAddress,
			dto.workMethod,
			dto.salaryFrom,
			dto.salaryTo,
			dto.skills,
			section,
			company
		);
		await job.save();
	}

	return Promise.resolve();
}
