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
let Argos = function () {
    // Login to Argos 
    let username_input = protractor_1.element(protractor_1.by.model('model.username'));
    let password_input = protractor_1.element(protractor_1.by.model('model.password'));
    let submit_button = protractor_1.element(protractor_1.by.id('submit'));
    this.LoginToArgos = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.get('http://10.200.10.28/Platform/');
            yield protractor_1.browser.manage().window().maximize();
            yield protractor_1.browser.sleep(3000);
            yield username_input.sendKeys('admin');
            yield password_input.sendKeys('#Kognif.ai2017');
            yield submit_button.click();
            yield protractor_1.browser.sleep(20000);
        });
    };
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
    let app_menu_button = protractor_1.element(protractor_1.by.xpath('//*[@id="app-menu-button"]'));
    let applications_menu = protractor_1.element(protractor_1.by.xpath('//span[.="Applications"]'));
    let drainageanalysis_submenu = protractor_1.element(protractor_1.by.xpath('//a[contains(.,"Drainage Analysis")]'));
    let grid_app_menu_button = protractor_1.element(protractor_1.by.xpath('//button[@id="app-menu-button"]'));
    let pipelineviewer_submenu = protractor_1.element(protractor_1.by.xpath('//a[contains(.,"Pipeline Viewer")]'));
    this.ClickAppMenu = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield app_menu_button.click();
        });
    };
    this.ClickApplications = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield applications_menu.click();
        });
    };
    this.ClickDrainageAnalysis = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield drainageanalysis_submenu.click();
        });
    };
    this.ClickPipelineViewer = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield pipelineviewer_submenu.click();
        });
    };
    this.ClickGridAppMenu = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield grid_app_menu_button.click();
        });
    };
    // Creating SST and MST
    let exportsnapshot = protractor_1.element(protractor_1.by.css('svg[ng-click="vm.openSnapshotDetailsForm();"]'));
    let snapshottitle = protractor_1.element(protractor_1.by.id('title'));
    let savebuttonforSS = protractor_1.element(protractor_1.by.xpath("//button[2]//span[@class='kx-btn__txt']"));
    let browsesnapshot = protractor_1.element(protractor_1.by.css('svg[ng-click="vm.toggleSnapshotList()"]'));
    let createdsnapshot = protractor_1.element(protractor_1.by.xpath("//div[@id='suggestionpanel']/div[1]//tr[@class='kx-typescale--small']//span[@class='ng-binding']"));
    // MST
    let savebuttonforMS = protractor_1.element(protractor_1.by.xpath("//button[@class='kx-btn kx-btn--skin-primary kx-btn--size-tiny']//span[@class='kx-btn__txt']"));
    let multiplesnapshot_radiobutton = protractor_1.element(protractor_1.by.xpath("//tr[4]//label[2]/span[@class='kx-switch__fake']"));
    let timeformatfield = protractor_1.element(protractor_1.by.css('[ng-model="vm.selectedFormat"]'));
    let timeformatoption = protractor_1.element(protractor_1.by.xpath("//option[.='Minute']"));
    let countfield = protractor_1.element(protractor_1.by.xpath("//input[@id='tillCount']"));
    this.ClickExportSnapshot = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield exportsnapshot.click();
        });
    };
    this.InputTitle = function (SST) {
        return __awaiter(this, void 0, void 0, function* () {
            yield snapshottitle.sendKeys(SST);
        });
    };
    this.ClickSaveSS = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield savebuttonforSS.click();
        });
    };
    this.ClickBrowseSnapshot = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield browsesnapshot.click();
        });
    };
    this.GetsnapshotName = function () {
        return __awaiter(this, void 0, void 0, function* () {
            var SnapName = yield createdsnapshot.getText();
            return SnapName;
        });
    };
    // MS
    this.ClickSaveMS = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield savebuttonforMS.click();
        });
    };
    this.ClickMSRadiobutton = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield multiplesnapshot_radiobutton.click();
        });
    };
    this.ClickTimeFormatField = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield timeformatfield.click();
        });
    };
    this.SelectTimeFormatOption = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield timeformatoption.click();
        });
    };
    this.ClickCountFiled = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield countfield.click();
        });
    };
    this.ClearCountField = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield countfield.clear();
        });
    };
    this.InputCountvalue = function (countnumber) {
        return __awaiter(this, void 0, void 0, function* () {
            yield countfield.sendKeys(countnumber);
        });
    };
    // Delete Snapshot 
    let deletemenu = protractor_1.element(protractor_1.by.css("div[data-index='0'] #Menu"));
    let deletebutton = protractor_1.element(protractor_1.by.xpath("//td[@class='kx-typescale--small']/div[.='Delete']"));
    let Yes_Confirmationdelete = protractor_1.element(protractor_1.by.xpath("//button[@class='kx-btn kx-btn--skin-primary kx-btn--size-large']"));
    this.DeleteSnapahot = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield deletemenu.click();
            yield protractor_1.browser.sleep(3000);
            yield deletebutton.click();
            yield protractor_1.browser.sleep(3000);
            yield Yes_Confirmationdelete.click();
            yield protractor_1.browser.sleep(4000);
        });
    };
    // Cancel Snapshot
    // Logout 
    let admin_menu = protractor_1.element(protractor_1.by.xpath("//span[.='admin']"));
    let logout_button = protractor_1.element(protractor_1.by.xpath("//span[.='Logout']"));
    this.logout = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield grid_app_menu_button.click();
            yield admin_menu.click();
            logout_button.click();
        });
    };
    //pipeline viewer - search functionality
    let detail_search = protractor_1.element(protractor_1.by.xpath('//input[@id="conedsuggestions"]'));
    this.PipelineClickSearchbox = function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield detail_search.click();
        });
    };
    this.PipelineInputvalueToSearchbox = function (mainvalve) {
        return __awaiter(this, void 0, void 0, function* () {
            yield detail_search.sendKeys(mainvalve);
        });
    };
};
module.exports = new Argos();
//# sourceMappingURL=Argos.js.map