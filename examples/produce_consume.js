/// consume as stream

let flv = require('../dist');

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
} 

/// create listener on emitter
const EventEmitter = require('events').EventEmitter;
const emitter = new EventEmitter();
emitter.on('data', (record) => {
    console.log("received event", record.offset, Buffer.from(record.record).toString());

})

const TOPIC_NAME = "message2";
const MESSAGE_COUNT = 100;

async function consume() {

    try {
        console.log("connecting client to sc");
        let sc = await flv.connect();
        console.log("connect to", sc.addr());

        /// create topic if doesn't exists
        let admin = sc.admin();
        let topic = await admin.findTopic(TOPIC_NAME);

        // creat topic if topic doesn't exists
        if (topic === undefined) {
            console.log("topic %s not found, creating",TOPIC_NAME);
            await admin.createTopic(TOPIC_NAME, { partition: 1, replication: 1 });
            await sleep(2000);
        } 

        // look up replica
        let replica = await sc.replica(TOPIC_NAME, 0);

        // produce message
        for (var i = 1; i <= MESSAGE_COUNT; i++) {
            const recordStr = `{x: ${i}}`;
            await replica.produce(recordStr);
            console.log('>> ', recordStr);
        }

        /// consume as stream
        replica.consume(
            emitter.emit.bind(emitter),
            {
                offset: 0
            }
        );
        
        
    } catch (ex) {
        console.log("error", ex);
    }
}


consume()