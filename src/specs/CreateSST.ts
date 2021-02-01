import {​​​​​​​ element, browser, by }​​​​​​​ from 'protractor';
// let SingleSnapahot = require ('../pages/loginPage')

const Argos = require("../pages/Argos");
const { ClickExportSnapshot } = require("../pages/Argos");

describe('Creating Single Snapshot', () => {
   
    beforeAll(async () => {

        browser.waitForAngularEnabled(false)


    });

    it('create SST', async () => {
     
       
        await Argos.ClickExportSnapshot();
        await browser.sleep(3000);
        await Argos.InputTitle('SingleSnaphotTest');
        await browser.sleep(3000);
        await Argos.ClickSaveSS();
        await browser.sleep(3000);
        await Argos.ClickBrowseSnapshot();
        await browser.sleep(3000);
        var SSName = await Argos.GetsnapshotName();
        console.log(SSName);
        expect(SSName).toBe("SingleSnaphotTest1"); 
        await Argos.DeleteSnapahot();
        await Argos.ClickBrowseSnapshot();
        

            
    });
});