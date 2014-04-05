$(function(){
    if(cfg.controller == 'api'){
        console.log('Subscribing to clans room...');
        socket.get('/api/clans/subscribe', function(res){
            console.log('Subscribing successful', res);
        });

        var successData = [];
        var failData = [];

        var chart = new CanvasJS.Chart("chartContainer",{
            backgroundColor: '#272B30',
            title :{
                fontColor: '#BBBFC2',
                text: "Clan updating cycle",
                fontFamily: 'Oswald'
            },
            axisY: {
                includeZero: true,
                titleFontColor: '#BBBFC2',
                labelFontColor: '#BBBFC2',
                gridColor: '#BBBFC2',
                titleFontFamily: 'Oswald',
                labelFamily: 'Oswald'
            },
            axisX: {
                titleFontColor: '#BBBFC2',
                labelFontColor: '#BBBFC2',
                gridColor: '#BBBFC2',
                titleFontFamily: 'Oswald',
                labelFamily: 'Oswald'
            },
            legend: {
                horizontalAlign: "left",
                verticalAlign: "bottom",
                fontColor: '#BBBFC2',
                fontSize: 15,
                fontFamily: 'Oswald'
            },
            data: [{
                type: "stackedColumn",
                color: "darkred",
                showInLegend: true,
                legendText: "Unsuccessful clan updates",
                dataPoints: failData
            },{
                type: "stackedColumn",
                color: "darkgreen",
                showInLegend: true,
                legendText: "Clans successfully updated",
                dataPoints: successData
            }]
        });

        var currentCount = 0;
        var currentFailCount = 0;

        app.addHandler('apiroom#update', function(id, msg) {
            if(msg.action == 'done'){
                currentCount += msg.count;
            }else if(msg.action == 'failed'){
                currentFailCount += msg.count;
            }
        });

        setInterval(function(){
            var now = new Date()
            successData.push({
                x: now,
                y: currentCount
            });
            failData.push({
                x: now,
                y: currentFailCount
            });
            currentCount = 0;
            currentFailCount = 0;
            if (successData.length > 30){
                successData.shift();
                failData.shift();
            }
            chart.render();
        }, 1000);
    }
});