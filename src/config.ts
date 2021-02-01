// An example configuration file.

var HtmlReporter = require('protractor-beautiful-reporter');
exports.config = {
  directConnect: true,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },

  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to the current working directory when
  // protractor is called.
  specs: [//'specs/LoginToArgos.js',
  'specs/LoadingDA.js', 
  'specs/CreateSST.js', 
  'specs/CreateMST.js',
  'specs/PipelineViewerTest.js'
],

  onPrepare: () => {​​​​​
    jasmine.getEnv().addReporter(new HtmlReporter({​​​​​
      baseDirectory: 'D:/KDI_Projects/ConEdison/Automation/Argos/htmlreport'
      }​​​​​).getJasmine2Reporter());
  },

  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    defaultTimeoutInterval: 500000
  }



    
};
