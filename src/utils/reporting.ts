import * as allure from "allure-js-commons";

export const reportStep = async <T>(name: string, action: () => Promise<T> | T): Promise<T> =>
  allure.step(name, async () => action());
