var mongoose = require('mongoose');
var XMLWriter = require('xml-writer');
var Dropbox = require('dropbox');
var prompt = require('prompt');
var url = '';
// Define response model schema
var SurveyResponseSchema = new mongoose.Schema({
    // phone number of participant
    phone: String,

    timestamp: Number,

    // status of the participant's current response
    complete: {
        type: Boolean,
        default: false
    },

    // record of answers
    responses: [mongoose.Schema.Types.Mixed]
}, { usePushEach: true });

// For the given phone number and data, advance to the next
// question
SurveyResponseSchema.statics.advanceSurvey = function(args, cb) {
    var surveyData = args.survey;
    var phone = args.phone;
    var input = args.input;
    //var timestamp = Date.now();
    var surveyResponse;

    // Find current incomplete
    SurveyResponse.findOne({
        phone: phone,
        //timestamp: timestamp,
        complete: false
    }, function(err, doc) {
        surveyResponse = doc || new SurveyResponse({
            phone: phone,
            //timestamp: timestamp
        });
        processInput();
    });

    // fill in any answer to the current question, and determine next question
    // to ask
    function processInput() {
        // If we have input, use it to answer the current question
        var responseLength = surveyResponse.responses.length;
        var currentQuestion = surveyData[responseLength];

        // if there's a problem with the input, we can re-ask the same question
        function reask(questionType) {
            var responseMsg = 'Data not correct. Please introduce a ' + questionType;
            cb.call(surveyResponse, null, surveyResponse, responseLength);
        }

        // If we have no input, ask the current question again
        if (!input) return reask(currentQuestion.type);

        // Otherwise use the input to answer the current question
        var questionResponse = {};
        if (currentQuestion.type === 'boolean') {
            // Anything other than '1' or 'yes' is a false
            var isTrue = input === '1' || input.toLowerCase() === 'yes';
            questionResponse.answer = isTrue;
        } else if (currentQuestion.type === 'number') {
            // Try and cast to a Number
            var num = Number(input);
            if (isNaN(num)) {
                // don't update the response, return the same question
                return reask(currentQuestion.type);
            } else {
                questionResponse.answer = num;
            }
        } else if (input.indexOf('http') === 0) {
            // input is a recording URL
            questionResponse.recordingUrl = input;
        } else {
            // otherwise store raw value
            questionResponse.answer = input;
        }

        // // Save type from question
        questionResponse.type = currentQuestion.type;
        surveyResponse.responses.push(questionResponse);

        if (surveyResponse.responses.length === surveyData.length) {
            var timestamp = Date.now();
            surveyResponse.responses.push(timestamp);
            xmlString = writeXML(timestamp);
            // Upload to dropbox
            uploadToDropbox(timestamp, xmlString);
            surveyResponse.complete = true;
        }

        // Save response
        surveyResponse.save(function(err) {
            if (err) {
                reask(currentQuestion.type);
            } else {
                cb.call(surveyResponse, err, surveyResponse, responseLength+1);
            }
        });
    }

    function writeXML(timestamp) {
        xw = new XMLWriter(true);
        xw.startDocument('1.0', 'UTF-8');
        xw.startElement('root');
        xw.writeAttribute('telephone_number', surveyResponse.phone);
        xw.writeAttribute('timestamp', timestamp);
        for(i = 0; i < surveyResponse.responses.length - 1; i++){
            var key = surveyData[i].key;
            var resp = surveyResponse.responses[i];
            xw.writeElement(surveyData[i].key, surveyResponse.responses[i].answer);
        }
        xw.endElement();
        xw.endDocument();

        return xw.toString();
    }

    function uploadToDropbox(timestamp, contents) {
        var dbx = new Dropbox({ accessToken: 'H0NqNBjCM7AAAAAAAAAAEmi9GJJEgNCw4Fa8pwJPe8Ly4dOaPXgC1jVrAUxaRsh8' });
        dbx.filesUpload({ path: '/storage/' + timestamp + '.xml', contents: contents })
                  .then(function (response) {
                    console.log(response);
                    shareDropboxLink(dbx, timestamp);
                  })
                  .catch(function (err) {
                    console.log(err);
                  });
    }

    function shareDropboxLink(dbx, timestamp) {
        dbx.sharingCreateSharedLinkWithSettings({ path: '/storage/' + timestamp + '.xml', settings: {} })
                  .then(function (response) {
                    var url = response.url.substring(0, response.url.length - 1) + "1";
                    surveyResponse.responses.push(url);
                    surveyResponse.save(function(err) {
                        if (err) {
                            // TO DO
                        }
                    });
                  })
                  .catch(function (err) {
                    console.log(err);
                  });
    }

};

// Export model
delete mongoose.models.SurveyResponse
delete mongoose.modelSchemas.SurveyResponse
var SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
module.exports = SurveyResponse;
