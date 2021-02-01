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
const ptor_1 = require("protractor/built/ptor");
let pipelineviewer = require('../pages/Argos');
describe('Pipeline Viewer Tests', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        protractor_1.browser.waitForAngularEnabled(false);
        yield pipelineviewer.LoginToArgos();
    }));
    it('Loading Pipeline viewer application', () => __awaiter(void 0, void 0, void 0, function* () {
        yield pipelineviewer.ClickAppMenu();
        yield pipelineviewer.ClickApplications();
        yield pipelineviewer.ClickPipelineViewer();
        yield protractor_1.browser.sleep(20000);
        yield pipelineviewer.ClickGridAppMenu();
        yield protractor_1.browser.sleep(4000);
    }));
    it('search main valve', () => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.element(protractor_1.by.xpath('//div[@id="modeSelection"]')).click();
        yield protractor_1.element(protractor_1.by.xpath('//span[.="Equipment View"]')).click();
        yield pipelineviewer.PipelineClickSearchbox();
        yield protractor_1.browser.sleep(4000);
        yield pipelineviewer.PipelineInputvalueToSearchbox('MV-503');
        yield protractor_1.browser.sleep(4000);
        yield protractor_1.browser.actions().sendKeys(ptor_1.protractor.Key.ENTER).perform();
        yield protractor_1.browser.sleep(5000);
        yield protractor_1.browser.element(protractor_1.by.css('div[data-dictname="MV-503"] > [viewBox="0 50 210 197"]')).click();
        yield protractor_1.browser.sleep(4000);
    }));
    /*     it('click on searched control system', async () => {
    
        });  */
});
//# sourceMappingURL=PipelineViewerTest.js.map