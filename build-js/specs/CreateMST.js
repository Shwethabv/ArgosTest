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
let multiplesnapshot = require('../pages/Argos');
describe('Create Multiple Snapshot', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
    }));
    it('Create MST', () => __awaiter(void 0, void 0, void 0, function* () {
        yield multiplesnapshot.ClickExportSnapshot();
        yield protractor_1.browser.sleep(3000);
        yield multiplesnapshot.InputTitle('MultipleSnaphotTest');
        yield protractor_1.browser.sleep(3000);
        yield multiplesnapshot.ClickMSRadiobutton();
        yield multiplesnapshot.ClickTimeFormatField();
        yield multiplesnapshot.SelectTimeFormatOption();
        yield protractor_1.browser.sleep(3000);
        yield multiplesnapshot.ClickCountFiled();
        yield multiplesnapshot.ClearCountField();
        yield protractor_1.browser.sleep(2000);
        yield multiplesnapshot.InputCountvalue('2');
        yield protractor_1.browser.sleep(3000);
        yield multiplesnapshot.ClickSaveMS();
        yield multiplesnapshot.ClickBrowseSnapshot();
        yield protractor_1.browser.sleep(3000);
        var MSName = yield multiplesnapshot.GetsnapshotName();
        console.log(MSName);
        expect(MSName).toBe('MultipleSnaphotTest');
        yield multiplesnapshot.DeleteSnapahot();
        yield protractor_1.browser.sleep(3000);
        yield multiplesnapshot.logout();
        yield protractor_1.browser.sleep(10000);
    }));
});
//# sourceMappingURL=CreateMST.js.map