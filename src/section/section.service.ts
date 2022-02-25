import { Section } from '../entity/Section';
import { EntityNotFoundError } from '../error/entity-not-found.error';
import { SECTION_STATE } from '../job/utils/section-state';

export async function createSection(keyword: string) {
	const section = new Section();
	section.keyword = keyword;
	section.status = SECTION_STATE.PROCESSING;
	return await section.save();
}

export async function updateSectionStatus(id: number, state: SECTION_STATE) {
	const section = await Section.findOne(id);
	if (!section) throw new EntityNotFoundError('section', id);

	section.status = state;
	return await section.save();
}

export async function getSectionById(id: number) {
	const section = await Section.findOne(id);
	if (!section) throw new EntityNotFoundError('section', id);

	return section;
}

export async function getSections(status: SECTION_STATE) {
	const sections = await Section.find({
		where: {
			status
		},
	});
	return sections;
}
