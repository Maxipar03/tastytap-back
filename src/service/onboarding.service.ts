import { Types } from "mongoose";
import { onboardingMongoDao } from "../dao/mongodb/onboarding.dao.js";
import { OnboardingDao, OnboardingDB } from "../types/onboarding.types.js";
import { BadRequestError } from "../utils/custom-error.utils.js";

export default class OnboardingServices {
    private dao: OnboardingDao  ;

    constructor(dao: OnboardingDao) {
        this.dao = dao;
    }

    createOnboarding = async (id: Types.ObjectId, body: any): Promise<OnboardingDB> => {
        return await this.dao.create({ ...body, user: id, statusRequest: "PENDING" });
    };

    approveOnboarding = async (id: string): Promise<OnboardingDB | null> => {
        const data = await this.dao.update(id, { statusRequest: "APPROVED" });
        if (!data) throw new BadRequestError("No se aprovar el restaurante")
        await this.dao.create({name: data?.restaurantName, address: data?.address, user: data?.user});
        return data;
    };

    rejectOnboarding = async (id: string): Promise<OnboardingDB | null> => {
        return await this.dao.update(id, { statusRequest: "REJECTED" });
    };

}

export const onboardingServices = new OnboardingServices(onboardingMongoDao);
