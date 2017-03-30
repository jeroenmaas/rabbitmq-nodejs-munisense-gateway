var Config = {
    munisense: {
        vendor: "",
        secret: "",
        gateway_ip: ""
    },
    reporting: {
        report_to_munisense_frequency: 1000*15
    },
    rabbitmq: {
        host: "",
        queue: "",
        username: "",
        password: ""
    }
};

exports.Config = Config;