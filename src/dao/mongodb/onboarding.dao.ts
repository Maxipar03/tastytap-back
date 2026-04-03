
import MongoDao from "./mongo.dao.js";
import { Model } from "mongoose";
import { OnboardingModel } from "./models/onboarding.model.js";
import { OnboardingDB } from "../../types/onboarding.types.js";
import { OnboardingDto } from "../../dto/onboarding.dto.js";

class OnboardingMongoDao extends MongoDao<OnboardingDB, OnboardingDto> {
    constructor(model: Model<OnboardingDB>) {
        super(model);
    }
}

export const onboardingMongoDao = new OnboardingMongoDao(OnboardingModel)