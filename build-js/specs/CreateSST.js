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
// let SingleSnapahot = require ('../pages/loginPage')
const Argos = require("../pages/Argos");
const { ClickExportSnapshot } = require("../pages/Argos");
describe('Creating Single Snapshot', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
    }));
    it('create SST', () => __awaiter(void 0, void 0, void 0, function* () {
        yield Argos.ClickExportSnapshot();
        yield protractor_1.browser.sleep(3000);
        yield Argos.InputTitle('SingleSnaphotTest');
        yield protractor_1.browser.sleep(3000);
        yield Argos.ClickSaveSS();
        yield protractor_1.browser.sleep(3000);
        yield Argos.ClickBrowseSnapshot();
        yield protractor_1.browser.sleep(3000);
        var SSName = yield Argos.GetsnapshotName();
        console.log(SSName);
        expect(SSName).toBe("SingleSnaphotTest1");
        yield Argos.DeleteSnapahot();
        yield Argos.ClickBrowseSnapshot();
    }));
});
//# sourceMappingURL=CreateSST.js.map