import {​​​​​​​ element, browser, by }​​​​​​​ from 'protractor';
let loginPage = require('../pages/Argos');

describe('login to argos application',  () => {
    beforeAll(async () =>{

    browser.waitForAngularEnabled(false)

});
    
    it('login with valid credentials', async () => { 
        
  
     await loginPage.get("http://10.200.10.28/Platform/");
   
     await browser.manage().window().maximize();
     await browser.sleep(3000);
     await loginPage.eneterUsername('admin');
     await loginPage.enterPassword('#Kognif.ai2017');
     await loginPage.LoginClick(); 
     await browser.sleep(40000);
 

    });
});
