var mongoose = require('mongoose');
// Define response model schema
var SurveyResponseSchema = new mongoose.Schema({
    // phone number of participant
    phone: String,

    timestamp: {
        type: Number,
        default: 0
    },

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
    var timestamp = Date.now();
    var surveyResponse;

    // Find current incomplete
    SurveyResponse.findOne({
        phone: phone,
        timestamp: timestamp,
        complete: false
    }, function(err, doc) {
        surveyResponse = doc || new SurveyResponse({
            phone: phone,
            timestamp: timestamp
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
        function reask() {
            cb.call(surveyResponse, null, surveyResponse, responseLength);
        }

        // If we have no input, ask the current question again
        if (!input) return reask();

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
                return reask();
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

        // Save type from question
        questionResponse.type = currentQuestion.type;
        surveyResponse.responses.push(questionResponse);

        if (surveyResponse.responses.length === surveyData.length) {
            surveyResponse.complete = true;
        }

        // Save response
        surveyResponse.save(function(err) {
            if (err) {
                reask();
            } else {
                cb.call(surveyResponse, err, surveyResponse, responseLength+1);
            }
        });
    }
};

// Export model
delete mongoose.models.SurveyResponse
delete mongoose.modelSchemas.SurveyResponse
var SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
module.exports = SurveyResponse;
