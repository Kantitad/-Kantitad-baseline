const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const http = require('http')
const server = http.createServer(app)
const Web3 = require('web3');
const truffle_connect = require('./connection/app.js');
const bodyParser = require('body-parser');

const { hash } = require('./baseline/utils/hash.js')

const KafkaProducer = require('./baseline/messaging/producer.js');
const producer = new KafkaProducer();

const KafkaConsumer = require('./baseline/messaging/consumer.js')
KafkaConsumer.consume(console.log).then(() => {
  console.log('consume success')
}).catch(err => {
  console.log('consume err ', err)
})

const { socketConnection } = require('./baseline/utils/socket')
socketConnection(server)

const proofVerify = require('./baseline/privacy/proof-verify.js')

const { organizationRouter } = require('./baseline/organization')
const { workgroupRouter } = require('./baseline/workgroup')


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', express.static('public_static'));

app.use('/organization', organizationRouter)
app.use('/workgroup', workgroupRouter)

app.get('/accounts', (req, res) => {
  truffle_connect.start(function (accounts) {
    res.send(accounts);
  })
});

app.post('/proof', async (req, res) => {
  fullProof = await proofVerify.fullProve(req.body);
  res.send(fullProof);
});

app.post('/verifyInputs', async(req, res) => {
  verifyInputs = await proofVerify.getVerifyProofInputs(req.body.proof, req.body.publicSignals);
  res.send(verifyInputs);
});

app.post('/verify', async(req, res) => {
  // TODO: destructure...
  verifyInputs = await proofVerify.getVerifyProofInputs(req.body.proof, req.body.publicSignals);
  truffle_connect.verify(verifyInputs.a, verifyInputs.b, verifyInputs.c, verifyInputs.input, () => {
    res.send('verified');
  });
})

app.post('/testMsg', async(req, res) => {
  await producer.queue(req.body.message)
  res.send('msg queued')
})


app.post('/hash', async(req, res) => {
  const boardHash = await hash(req.body);
  res.send(boardHash);
})

server.listen(port, async () => {
  truffle_connect.web3 = new Web3(new Web3.providers.HttpProvider("http://ganache-cli:8545"));

  console.log("Express Listening at http://localhost:" + port);
});
