import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SECTION_STATE } from '../job/utils/section-state';
import { Job } from './Job';

@Entity()
export class Section extends BaseEntity {
    @PrimaryGeneratedColumn({
        unsigned: true,
    })
    id: number;

    @Column({
        length: 50,
    })
    keyword: string;

    @Column({
        nullable: true,
    })
    exportFileName: string;

    @Column({
        type: 'enum',
        enum: SECTION_STATE,
        default: SECTION_STATE.PROCESSING,
    })
    status: SECTION_STATE;

    @OneToMany(() => Job, job => job.section)
    jobs: Job[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
