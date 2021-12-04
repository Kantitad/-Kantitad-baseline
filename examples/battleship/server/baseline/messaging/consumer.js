const KafkaConfig = require('./config.js');
const { orgEventType, proofEventType, targetEventType } = require('./eventType.js');
let kafkaConfig = new KafkaConfig();
const consumer = kafkaConfig.consumer();

const { insertOrg } = require('../organization.js')

async function consume() {
  consumer.connect();
  consumer.on('ready', () => {

    console.log('consumer ready..')
    consumer.subscribe(['battleship', 'orgReg', 'proof']);
    consumer.consume();
  
  }).on('data', async (data) => {
    const currentPlayerId = process.env.PLAYER_ID;
    switch(data.topic) {
      case 'orgReg':
        insertOrg(orgEventType.fromBuffer(data.value))
        break;
      case 'proof':
        const proofMessage = proofEventType.fromBuffer(data.value);
        if (proofMessage.playerId === currentPlayerId) {
          console.log('proof message received ', proofEventType.fromBuffer(data.value))
        }
        break;
      case 'battleship': 
        const targetMessage = targetEventType.fromBuffer(data.value);
        if (targetMessage.playerId === currentPlayerId) {
          console.log('target message received ', targetEventType.fromBuffer(data.value))
          // TODO: push information to frontend, so frontend can know to call /proof endpoint
        }
        break;
      default:
        console.warn('unsupported topic received ', data.topic)
      }
    }
  )
}

module.exports = {
  consume
};