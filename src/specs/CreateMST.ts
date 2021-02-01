import {​​​​​​​ element, browser, by }​​​​​​​ from 'protractor';

let multiplesnapshot = require('../pages/Argos');

describe('Create Multiple Snapshot', () => {
 
    beforeAll(async ()=>{
  
        browser.waitForAngularEnabled(false)

    });

    it('Create MST', async () =>{
     
        await multiplesnapshot.ClickExportSnapshot();
        await browser.sleep(3000);
        await multiplesnapshot.InputTitle('MultipleSnaphotTest');
        await browser.sleep(3000);
        await multiplesnapshot.ClickMSRadiobutton();
        await multiplesnapshot.ClickTimeFormatField();
        await multiplesnapshot.SelectTimeFormatOption();
        await browser.sleep(3000);
        await multiplesnapshot.ClickCountFiled();
        await multiplesnapshot.ClearCountField();
        await browser.sleep(2000);
        await multiplesnapshot.InputCountvalue('2');
        await browser.sleep(3000);
        await multiplesnapshot.ClickSaveMS();
        await multiplesnapshot.ClickBrowseSnapshot();
        await browser.sleep(4000);
        var MSName =await multiplesnapshot.GetsnapshotName();
        console.log(MSName);
        expect(MSName).toBe('MultipleSnaphotTest');
        await multiplesnapshot.DeleteSnapahot();
        await browser.sleep(3000);
        await multiplesnapshot.logout();
        await browser.sleep(10000);


    });
});