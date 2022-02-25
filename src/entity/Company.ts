import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Job } from './Job';

@Entity()
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn({
        unsigned: true,
    })
    id: number;

    @Column({
        unique: true,
    })
    public url: string;
    
    @Column()
    public name: string;

    @Column({
        nullable: true,
    })
    public address?: string;

    @Column({
        nullable: true,
    })
    public imageUrl?: string;

    @OneToMany(() => Job, job => job.company)
    public jobs: Job[];
}
