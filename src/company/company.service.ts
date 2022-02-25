import { getRepository } from "typeorm";
import { Company } from "../entity/Company";
import { CompanyDTO } from "./company.dto";


export async function findOrCreateCompany(companyDto: CompanyDTO) {
    let company = await Company.findOne({
        select: ['id', 'url', 'name'],
        where: {
            url: companyDto.url
        }
    });

    if(company)
        return company;
    
    company = new Company();
    company.url = companyDto.url;
    company.name = companyDto.name;
    company.address = companyDto.address;
    company.imageUrl = companyDto.imageUrl;
    return await company.save();
}