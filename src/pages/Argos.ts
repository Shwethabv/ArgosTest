import {​​​​​​​ element, browser, by }​​​​​​​ from 'protractor';
let Argos = function(){

// Login to Argos 

    let username_input = element(by.model('model.username'));
    let password_input =  element(by.model('model.password'));
    let submit_button =  element(by.id('submit'));

    this.LoginToArgos = async function() {
       await browser.get('http://10.200.10.28/Platform/');
       await browser.manage().window().maximize();
       await browser.sleep(3000);
       await username_input.sendKeys('admin');
       await password_input.sendKeys('#Kognif.ai2017');
       await submit_button.click();
       await browser.sleep(20000);

    }
/* 
    this.eneterUsername= async function(userN){
      await username_input.sendKeys(userN);
    }

    this.enterPassword = async function(password){
       await password_input.sendKeys(password);
    }

    this.LoginClick = async function(){
       await submit_button.click();
    } */

// Loading Drainage Analysis//  Loading Pipeline Viewer
   
   let app_menu_button = element(by.xpath('//*[@id="app-menu-button"]'));
   let applications_menu = element(by.xpath('//span[.="Applications"]'));
   let drainageanalysis_submenu = element(by.xpath('//a[contains(.,"Drainage Analysis")]'));
   let grid_app_menu_button = element(by.xpath('//button[@id="app-menu-button"]'));

   let pipelineviewer_submenu = element(by.xpath('//a[contains(.,"Pipeline Viewer")]'));

   this.ClickAppMenu = async function(){
        await app_menu_button.click();
      }

   this.ClickApplications = async function(){
      await applications_menu.click();
   }

   this.ClickDrainageAnalysis = async function(){
      await drainageanalysis_submenu.click();
   } 

   this.ClickPipelineViewer = async function(){
      await pipelineviewer_submenu.click();
   }
   this.ClickGridAppMenu = async function(){
      await grid_app_menu_button.click();
   }



// Creating SST and MST
   let exportsnapshot = element(by.css('svg[ng-click="vm.openSnapshotDetailsForm();"]'));
   let snapshottitle = element(by.id('title'));
   let savebuttonforSS = element(by.xpath("//button[2]//span[@class='kx-btn__txt']"));
   let browsesnapshot = element(by.css('svg[ng-click="vm.toggleSnapshotList()"]'));
   let createdsnapshot = element(by.xpath("//div[@id='suggestionpanel']/div[1]//tr[@class='kx-typescale--small']//span[@class='ng-binding']"));
  
 // MST
    let savebuttonforMS = element(by.xpath("//button[@class='kx-btn kx-btn--skin-primary kx-btn--size-tiny']//span[@class='kx-btn__txt']"));
    let multiplesnapshot_radiobutton = element(by.xpath("//tr[4]//label[2]/span[@class='kx-switch__fake']"));
    let timeformatfield = element(by.css('[ng-model="vm.selectedFormat"]'));
    let timeformatoption = element(by.xpath("//option[.='Minute']"));
    let countfield = element(by.xpath("//input[@id='tillCount']"));


   this.ClickExportSnapshot = async function(){
     await exportsnapshot.click();
   }

   this.InputTitle = async function(SST){
     await snapshottitle.sendKeys(SST);
   }

   this.ClickSaveSS = async function(){
     await savebuttonforSS.click();
   }

   this.ClickBrowseSnapshot = async function(){
    await browsesnapshot.click();
   }

   this.GetsnapshotName = async function(){
      var SnapName =  await createdsnapshot.getText();
      return SnapName;
   }

   // MS
   
   this.ClickSaveMS = async function(){
      await savebuttonforMS.click();
   }

   this.ClickMSRadiobutton = async function(){
      await multiplesnapshot_radiobutton.click();
   }

   this.ClickTimeFormatField = async function(){
      await timeformatfield.click();
   }

   this.SelectTimeFormatOption = async function(){
      await timeformatoption.click();
   }

   this.ClickCountFiled = async function(){
      await countfield.click();
   }

   this.ClearCountField = async function(){
      await countfield.clear();
   }

   this.InputCountvalue = async function(countnumber){
      await countfield.sendKeys(countnumber);
   }
   
// Delete Snapshot 

let deletemenu = element(by.css("div[data-index='0'] #Menu"));
let deletebutton = element(by.xpath("//td[@class='kx-typescale--small']/div[.='Delete']"));
let Yes_Confirmationdelete = element(by.xpath("//button[@class='kx-btn kx-btn--skin-primary kx-btn--size-large']"));

   this.DeleteSnapahot = async function(){

      await deletemenu.click();
      await browser.sleep(3000);
      await deletebutton.click();
      await browser.sleep(3000);
      await Yes_Confirmationdelete.click();
      await browser.sleep(4000);
   }

// Cancel Snapshot

// Logout 

let admin_menu = element(by.xpath("//span[.='admin']"));
let logout_button = element(by.xpath("//span[.='Logout']"));

 this.logout = async function(){
    await grid_app_menu_button.click();
    await admin_menu.click();
    logout_button.click();
 }

 //pipeline viewer - search functionality
 let detail_search = element(by.xpath('//input[@id="conedsuggestions"]'));

 this.PipelineClickSearchbox = async function(){
   await detail_search.click();
   
 }

 this.PipelineInputvalueToSearchbox = async function(mainvalve) {
   await detail_search.sendKeys(mainvalve);
 }

};

   module.exports = new Argos();