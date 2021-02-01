"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
let LoadDA = require('../pages/Argos');
describe('loading drainage analysis application', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
        yield LoadDA.LoginToArgos();
    }));
    it('load DAA', () => __awaiter(void 0, void 0, void 0, function* () {
        yield LoadDA.ClickAppMenu();
        yield LoadDA.ClickApplications();
        yield LoadDA.ClickDrainageAnalysis();
        yield protractor_1.browser.sleep(50000);
        yield LoadDA.ClickGridAppMenu();
        yield protractor_1.browser.sleep(4000);
    }));
});
//# sourceMappingURL=LoadingDA.js.map