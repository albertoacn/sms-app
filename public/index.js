$(function() {

    // Chart ages
    // function ages(results) {
    //     // Collect age results
    //     var data = {};
    //     for (var i = 0, l = results.length; i<l; i++) {
    //         var ageResponse = results[i].responses[0];
    //         var k = String(ageResponse.answer);
    //         if (!data[k]) data[k] = 1;
    //         else data[k]++;
    //     }

    //     // Assemble for graph
    //     var labels = Object.keys(data);
    //     var dataSet = [];
    //     for (var k in data)
    //         dataSet.push(data[k]);

    //     // Render chart
    //     var ctx = document.getElementById('ageChart').getContext('2d');
    //     var ageChart = new Chart(ctx).Bar({
    //         labels: labels,
    //         datasets: [
    //             {
    //                 label: 'Ages',
    //                 data: dataSet
    //             }
    //         ]
    //     });
    // }

    // Chart yes/no responses to lemur question
    // function lemurs(results) {
    //     // Collect lemur kicking results
    //     var yes = 0, no = 0;
    //     for (var i = 0, l = results.length; i<l; i++) {
    //         var lemurResponse = results[i].responses[1];
    //         lemurResponse.answer ? yes++ : no++;
    //     }

    //     var ctx = document.getElementById('lemurChart').getContext('2d');
    //     var ageChart = new Chart(ctx).Pie([
    //         { value: yes, label: 'Yes', color: 'green', highlight: 'gray' },
    //         { value: no, label: 'No', color: 'red', highlight: 'gray' }
    //     ]);
    // }

    // poor man's html template for a response table row
    // function row(response) {
    //     var tpl = '<tr><td>';
    //     tpl += response.answer || 'pending...' + '</td>';
    //     if (response.recordingUrl) {
    //         tpl += '<td><a target="_blank" href="'
    //             + response.recordingUrl 
    //             + '"><i class="fa fa-play"></i></a></td>';
    //     } else {
    //         tpl += '<td>N/A</td>';
    //     }
    //     tpl += '</tr>';
    //     return tpl;
    // }

    // add text responses to a table
    function freeText(results) {
        var $responses = $('#responses');
        var content = '';
        var tpl = '';
        for (var i = 0, l = results.length; i<l; i++) {
            tpl += '<tr>';
            for (var j = 0; j<3; j++) {
                tpl += '<td>'
                    + results[i].responses[j].answer
                    + '</td>';
            }
            tpl += '<td>' + results[i].phone + '</td>';
            tpl += '<td>' + results[i].responses[3].answer + '</td>';
            var resps = results[i].responses.length - 3;
            tpl += '<td>' + results[i].responses[resps] + '</td>';
            tpl += '<td>' + results[i].responses[resps+1] + '</td>';
            for (var j = 4; j<resps; j++) {
                tpl += '<td>'
                    + results[i].responses[j].answer
                    + '</td>';
            }
            tpl += '<td><a href="' + results[i].responses[resps+2] + '">Download XML</a></td>';
            tpl += '</tr>';
        }
        $responses.append(tpl);
    }

    // Load current results from server
    $.ajax({
        url: '/results',
        method: 'GET'
    }).done(function(data) {
        // Update charts and tables
        $('#total').html(data.results.length);
        // lemurs(data.results);
        // ages(data.results);
        freeText(data.results);
    }).fail(function(err) {
        console.log(err);
        alert('failed to load results data :(');
    });
});