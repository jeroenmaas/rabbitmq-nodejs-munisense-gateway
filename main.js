/**
 * Created by RedFire on 30-3-2017.
 */
var amqp = require('amqplib/callback_api');
var JOA = require('./lib/joa.js');
var Config = require('./config').Config;

JOA("https://joa3.munisense.net/");
JOA.debug = false;

JOA.headers({
    attribute: {
        vendor: Config.munisense.vendor,
        time: true,
        hash: true,
        secret: Config.munisense.secret
    },
    gatewayIdentifier: Config.munisense.gateway_ip
});

setInterval(function() {
    if(JOA.getMessages().length == 0) {
        console.warn("No messages in buffer to send to Munisense. Abort");
        return;
    }

    JOA.post({
        clear: true,
        clearOnlySuccess: false
    }, function(err, response, messages) {
        if(err) {
            console.log("%c Oops an error occured: ", "background: #f00; color: #fff; font-size: 18px");
            console.log(err);
        }

        if(response) {
            console.log("Reported sensor values to Munisense");
             // console.log("What the backoffice returned: ");
             // console.log(response.parsed);
             // console.log("The messages that were sent: ");
             // console.log(messages.parsed);
        }
    });
}, Config.reporting.report_to_munisense_frequency);

var global_con = null;
amqp.connect('amqp://' + Config.rabbitmq.username + ":" + Config.rabbitmq.password + "@" + Config.rabbitmq.host, function(err, conn) {
    global_con = conn;
    conn.createChannel(function(err, ch) {
        var q = Config.rabbitmq.queue;

        ch.assertQueue(q, {durable: false});

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
        ch.consume(q, function(msg) {
            var result = JSON.parse(msg.content);
            JOA.addZCLReport(result.eui64, null, null, "0x" + result.cluster_id.toString(16), "0x" + result.attribute_id.toString(16), "0x" + result.value_type.toString(16), result.timestamp, "" + result.value);
            //console.log(" [x] Received %s", msg.content.toString());
            ch.ack(msg);
        }, {noAck: false});
    });
});

process.on('SIGINT', function () {
    if(global_con) {
        global_con.close();
        global_con = null;
    }
    process.exit(2);
});

process.on('exit', function () {
    if(global_con) {
        global_con.close();
        global_con = null;
    }
    process.exit();
});