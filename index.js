
var AWS = require('aws-sdk');
var Alexa = require('alexa-sdk');


AWS.config.update({
  region: "eu-west-1" // or whatever region your lambda and dynamo is
  });
AWS.config.logger = console;
var mortgagesAPI = require('./helpers/mortgagesAPI.js');
var huisbankkorting;
var duurzaamheidskorting;
var tennurity = 0;
var perOfLoanAmount = 0;
var interestRates = 3;
var position =0;
var interestPeriods = 0;
var recheckingFlag = 0;
var countryCode ;
var phoneNumber;
var phoneSymbol = '+';
var completeNumber;
var emailAddress;


exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context, callback);  
  alexa.registerHandlers(LaunchRequesthandler,proceedingHandler,moneyouMsgHandler);
  alexa.execute();

};
var ses = new AWS.SES({
  region: 'eu-west-1' 
});

var LaunchRequesthandler={
  'LaunchRequest': function(){
    this.emit('GreetingIntent');
},

 'GreetingIntent' : function(){
    this.handler.state = "_PRCDHNDLR";
    this.response.speak('Welcome to Moneyou Mortgage , Would you like to check mortgage rate available ?')
    .listen('Can you say yes or no');
    this.emit(':responseReady');
  },

  'AMAZON.StopIntent': function () {
  // State Automatically Saved with :tell
  this.emit(':tell', 'Goodbye!');
  },

  'AMAZON.CancelIntent': function () {
  // State Automatically Saved with :tell
  this.emit(':tell', 'Goodbye!');
  },

  'AMAZON.HelpIntent': function () {
  this.emit(':ask','Try saying what is open moneyou');
  },

  'Unhandled': function() {
  this.response.speak('I am sorry friend. I am having trouble in getting the interest rate now. Please try after some time.');
  this.emit(':responseReady');
  },

  'FallbackIntent': function () {
  this.emitWithState('AMAZON.HelpIntent');
  }
};


var proceedingHandler = Alexa.CreateStateHandler("_PRCDHNDLR",{

  'DetailsIntent': function () {   
    console.log('Entering into details intent of proceeding handler'); 
    var confirmationFlag = this.event.request.intent.slots.GettingDetailsConfirmation.value;
    console.log('confirmationFlag in proceeding handler is',confirmationFlag);
    if(confirmationFlag === 'yes'){
      this.handler.state = "_MONEYMSGHNDLR";
      this.response.speak('Okay, Are you moneyou account holder').listen('Can you say yes or no');
      this.emit(':responseReady');
    }else if(confirmationFlag === 'no'){
      this.handler.state = "_MONEYMSGHNDLR";
      this.response.speak('Thanks, Happy to serve you later');
      this.emit(':responseReady'); 
    }else{  
      console.log('Entering into else block of proceeding handler');
      this.emit('GenericErrorIntent');      
    }
  }, 
  'GenericErrorIntent':function(){
    this.handler.state = "_PRCDHNDLR"; 
    this.response.speak('You can get details about mortgages interest period, Would you like to continue?').listen('Please say yes or no');
    this.emit(':responseReady');
  },
  'Unhandled': function() {
    this.response.speak('Sorry, Please help in providing proper answer and try saying open moneyou mortgage again');
    this.emit(':responseReady');
  }
});

var moneyouMsgHandler = Alexa.CreateStateHandler("_MONEYMSGHNDLR",{
  'DetailsIntent': function(){
    var confirmationFlag = this.event.request.intent.slots.GettingDetailsConfirmation.value;
	
    var accessToken = this.event.context.System.apiAccessToken
    var geoAPIEndPoint = this.event.context.System.apiEndpoint
    console.log('Crossed accestoken retreiving',accessToken);
    console.log('Crossed geoEndAPIPoint retreiving',geoAPIEndPoint);
    if(confirmationFlag === 'yes'){
       mortgagesAPI.getemailAddress(accessToken,geoAPIEndPoint)
      .then((response) => { 
      emailAddress = response;
      console.log('emailAddress is ::::::',emailAddress); 

      let eParams = {
        Destination: {
            ToAddresses: [emailAddress]
        },
        Message: {
            Body: {
                Text: {
                    Data: 'Dear Friend, Thank you for showing interest in Moneyou Mortgage. One of our executives will call you shortly  '
                }
            },
            Subject: {
                Data: 'Alexa Moneyou Enquiry for Mortgages'
            }
        },
        Source: "moneyoumortgage@gmail.com"
    };
    console.log('Crossed eparams declaration');
    ses.sendEmail(eParams, function(err, data){
      console.log('Entering in to send email block');

        if(err){
      console.log(err);
        } else {
          console.log('Sent Email Successfuly');
            //context.succeed(event);

        }
    }); 
  })
    console.log('coming out after sending email');

    //Implementing SNS

 
     mortgagesAPI.getPhoneNumber(accessToken,geoAPIEndPoint)
    .then((response) => { 
     console.log('response is ::::::',response); 
     countryCode = response.countryCode;
     phoneNumber = response.phoneNumber; 
     completeNumber = phoneSymbol+countryCode+phoneNumber;   
 
     console.log('countryCode is ::::::',countryCode); 
     console.log('phoneNumber is ::::::',phoneNumber); 
     console.log('completenumber is ::::::',phoneSymbol+countryCode+phoneNumber); 
     


     var sns = new AWS.SNS();
     console.log('completenumber is ::::::',phoneSymbol+countryCode+phoneNumber);
     var params = {
       Message: 'Thanks for contacting Moneyou, We are forwarding your enquiry to moneyou Help Desk. Thanks',
       MessageStructure: 'string',
       PhoneNumber: completeNumber
     };
     console.log('crossed problem maker -- sns');
     sns.publish(params, function(err, data) {
       if (err) console.log(err, err.stack); // an error occurred
       else     console.log(data);           // successful response
     });
    })
      this.response.speak('Moneyou is offering mortgage interest rate Bridging variable as 2.1 Percentage and you will receive this details in registered email id and mobile number.');
      this.emit(':responseReady');
    }else if (confirmationFlag === 'no'){
	        mortgagesAPI.getemailAddress(accessToken,geoAPIEndPoint)
      .then((response) => { 
      emailAddress = response;
      console.log('emailAddress is ::::::',emailAddress); 

      let eParams = {
        Destination: {
            ToAddresses: [emailAddress]
        },
        Message: {
            Body: {
                Text: {
                    Data: 'Dear Friend, Thank you for showing interest in Moneyou Mortgage. One of our executives will call you shortly '
                }
            },
            Subject: {
                Data: 'Alexa Moneyou Enquiry for Mortgages'
            }
        },
        Source: "moneyoumortgage@gmail.com"
    };
    console.log('Crossed eparams declaration');
    ses.sendEmail(eParams, function(err, data){
      console.log('Entering in to send email block');

        if(err){
      console.log(err);
        } else {
          console.log('Sent Email Successfuly');
            //context.succeed(event);

        }
    }); 
  })
    console.log('coming out after sending email');

    //Implementing SNS 
     mortgagesAPI.getPhoneNumber(accessToken,geoAPIEndPoint)
    .then((response) => { 
     console.log('response is ::::::',response); 
     countryCode = response.countryCode;
     phoneNumber = response.phoneNumber; 
     completeNumber = phoneSymbol+countryCode+phoneNumber;   
 
     console.log('countryCode is ::::::',countryCode); 
     console.log('phoneNumber is ::::::',phoneNumber); 
     console.log('completenumber is ::::::',phoneSymbol+countryCode+phoneNumber); 
     


     var sns = new AWS.SNS();
     console.log('completenumber is ::::::',phoneSymbol+countryCode+phoneNumber);
     var params = {
       Message: 'Thanks for contacting Moneyou, We are forwarding your enquiry to moneyou Help Desk. Thanks',
       MessageStructure: 'string',
       PhoneNumber: completeNumber
     };
     console.log('crossed problem maker -- sns');
     sns.publish(params, function(err, data) {
       if (err) console.log(err, err.stack); // an error occurred
       else     console.log(data);           // successful response
     });
    })
      this.response.speak('Moneyou is offering mortgage interest rate Bridging variable as 2.25 Percentage and you will receive this details in registered email id and mobile number.');
      this.emit(':responseReady');
    }
    else{      
      this.emit('GenericErrorIntent');
    }    
  },
  'GenericErrorIntent':function(){
    this.response.speak('We are providing discounts for moneyou account holder');
    this.emit(':responseReady');   
  },
  'Unhandled': function() {
    this.response.speak('Sorry, Please help in providing proper answer .Try saying Open moneyou again');
    this.emit(':responseReady');
  },

});


