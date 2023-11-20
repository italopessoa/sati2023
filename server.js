const express = require('express')
const axios = require('axios');
const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const app = express()
const port = 3000
const metadataUrl = 'http://169.254.169.254/latest/meta-data';
let privateInstanceIpAddress = "";
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
let region = '';
const describeInstances = async (vpcId) => {
  const client = new EC2Client({ region });
  const input = {
    Filters: [
      {
        Name: "vpc-id",
        Values: [
          vpcId,
        ],
      },
    ],
  };
  const command = new DescribeInstancesCommand(input);
  const response = await client.send(command);
  return response;
}

const getInternalInstancePrivateIp = async () => {
  const mac = await axios.get(`${metadataUrl}/mac`);
  const vpcId = await axios.get(`${metadataUrl}/network/interfaces/macs/${mac.data}/vpc-id`);
  const result = await describeInstances(vpcId.data);

  return result.Reservations
    .reduce((acc, curr) => [...acc, ...curr.Instances], [])
    .filter(({ Tags }) => Tags.some(tag => tag.Value.endsWith("-private-ec2")))
    .reduce((acc, curr) => acc = curr.PrivateIpAddress, "");
}

const getPrivateInstanceIpAddress = async () => {
  try {
    console.log("trying to get internal server ip address")
    return await getInternalInstancePrivateIp();
  } catch (error) {
    console.log("private ip address not found");
    console.error(error)
  }
  return "";
}

app.get('/public', async (req, res) => {
  console.log("request from external client");
  if (privateInstanceIpAddress === "") {
    privateInstanceIpAddress = await getPrivateInstanceIpAddress();
  }

  const privateInstanceEndpoint = `http://${privateInstanceIpAddress}:3000/private`;

  try {
    console.log("calling instance on private subnet");
    const internalResponse = await await axios.get(privateInstanceEndpoint);
    console.log("reponse received from instance on private subnet");

    res.header("Content-Type",'application/json');
    res.send(JSON.stringify({ publicResponse: internalResponse.data, date: new Date() }, null, 2));
    console.log("sending response to external client");
  } catch (error) {
    console.error(error);
    res.status(500).send("internal server is down, ", error);
  }
});

const getProducts = async () => {
  try {
    console.log("trying to get products from dynamodb")
    const client = new DynamoDBClient({ region });
    const command = new ScanCommand({
      TableName: "product"
    });
    const response = await client.send(command);

    return response.Items;
  } catch (error) {
    console.error(error);
    console.log("couldn't reach dynamodb ", error);
    throw error;
  }
}

app.get('/private', async (req, res) => {
  console.log("request from public subnet client");
  try {
    console.log("calling dynamodb");
    var products = await getProducts();
    console.log("reponse received from dynamodb");

    res.header("Content-Type",'application/json');
    res.send(JSON.stringify({ privateResponse: products, date: new Date() }, null, 2));
    console.log("sending response to client on public subnet");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.listen(port, async () => {
  const currentAz = (await axios.get(`${metadataUrl}/placement/availability-zone`)).data;
  region = currentAz.slice(0, -1);

  const ip = await getPrivateInstanceIpAddress();
  if (ip !== "") {
    privateInstanceIpAddress = ip;
  }
  console.log(`Sample app listening on port ${port}, region ${region}`);
});
