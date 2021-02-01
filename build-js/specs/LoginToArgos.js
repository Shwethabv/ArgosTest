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
let loginPage = require('../pages/Argos');
describe('login to argos application', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
    }));
    it('login with valid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
        yield loginPage.get("http://10.200.10.28/Platform/");
        yield protractor_1.browser.manage().window().maximize();
        yield protractor_1.browser.sleep(3000);
        yield loginPage.eneterUsername('admin');
        yield loginPage.enterPassword('#Kognif.ai2017');
        yield loginPage.LoginClick();
        yield protractor_1.browser.sleep(40000);
    }));
});
//# sourceMappingURL=LoginToArgos.js.map