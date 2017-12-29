var MessagingResponse = require('twilio').twiml.MessagingResponse;
var SurveyResponse = require('../models/SurveyResponse');
var survey = require('../survey_data');

// Handle SMS submissions
module.exports = function(request, response) {
    var phone = request.body.From;
    var input = request.body.Body;

    // respond with message TwiML content
    function respond(message) {
        var twiml = new MessagingResponse();
        twiml.message(message);
        response.type('text/xml');
        response.send(twiml.toString());
    }

    // Check if there are any responses for the current number in an incomplete
    // response
    SurveyResponse.findOne({
        phone: phone,
        complete: false
    }, function(err, doc) {
        if (!doc /*|| Date.now() > doc.timestamp + 3600000*/) {
            var responseMessage = '';
            //var timestamp = Date.now();
            if (doc) {
                responseMessage += 'Session expired. Restarting session... ';
            }
            var newSurvey = new SurveyResponse({
                phone: phone//,
                //timestamp: timestamp
            });
            newSurvey.save(function(err, doc) {
                // Skip the input and just ask the first question
                handleNextQuestion(err, doc, 0, responseMessage);
            });
        } else {
            // After the first message, start processing input
            SurveyResponse.advanceSurvey({
                phone: phone,
                input: input,
                survey: survey
            }, handleNextQuestion);
        }
    });

    // Ask the next question based on the current index
    function handleNextQuestion(err, surveyResponse, questionIndex, responsemsg = '') {
        var index = questionIndex;
        var question = survey[index];
        var responseMessage = responsemsg;

        if (err || !surveyResponse) {
            return respond('Terribly sorry, but an error has occurred. '
                + 'Please retry your message.');
        }

        // If question is null, we're done!
        if (!question) {
            return respond('Thank you for submiting your catch. Have a good day!');
        }

        // Add a greeting if this is the first question
        // if (questionIndex === 0) {
        //     responseMessage += 'Thank you for taking our survey! ';
        // }

        // Add question text
        responseMessage += question.text;

        // Add question instructions for special types
        if (question.type === 'boolean') {
            responseMessage += ' Type "yes" or "no".';
        }

        // reply with message
        respond(responseMessage);
    }
};
