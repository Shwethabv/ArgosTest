
import {​​​​​​​ element, browser, by }​​​​​​​ from 'protractor';
let LoadDA = require('../pages/Argos');


describe('loading drainage analysis application',  () => {
    beforeAll(async () =>{

    browser.waitForAngularEnabled(false)
    await LoadDA.LoginToArgos();
  

});

it('load DAA', async () => {

  
   await LoadDA.ClickAppMenu();
   await LoadDA.ClickApplications();
   await LoadDA.ClickDrainageAnalysis();
   await browser.sleep(20000);
   await LoadDA.ClickGridAppMenu();
   await browser.sleep(4000);
  
   

    });

});