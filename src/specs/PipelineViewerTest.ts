import {​​​​​​​ element, browser, by }​​​​​​​ from 'protractor';
import { protractor } from 'protractor/built/ptor';

let pipelineviewer = require('../pages/Argos');

describe('Pipeline Viewer Tests', () => {
 
    beforeAll(async ()=>{
  
        browser.waitForAngularEnabled(false)
        await pipelineviewer.LoginToArgos();

    });

    it('Loading Pipeline viewer application', async () =>{


        
        await pipelineviewer.ClickAppMenu();
        await pipelineviewer.ClickApplications();
        await pipelineviewer.ClickPipelineViewer();
        await browser.sleep(20000);
        await pipelineviewer.ClickGridAppMenu();
        await browser.sleep(4000);

    });
 
    it('search main valve', async () => {

        await element(by.xpath('//div[@id="modeSelection"]')).click();
        await element(by.xpath('//span[.="Equipment View"]')).click();
        await pipelineviewer.PipelineClickSearchbox();
        await browser.sleep(4000);
        await pipelineviewer.PipelineInputvalueToSearchbox('MV-503');
        await browser.sleep(4000);
        await browser.actions().sendKeys(protractor.Key.ENTER).perform();
        await browser.sleep(5000);
        await browser.element(by.css('div[data-dictname="MV-503"] > [viewBox="0 50 210 197"]')).click();
        await browser.sleep(4000);
        
        
    });
 
/*     it('click on searched control system', async () => {

    });  */

});