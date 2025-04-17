// require("dotenv").config();
const { appointmentSchema } = require("./schemas/appointments");
const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1"
});

const TABLE_NAME = process.env.TABLE_NAME;
const API_KEY = process.env.API_KEY;

exports.scheduleAppointment = async (event) => {
  const headers = event.headers || {};
  if (headers["x-api-key"] !== API_KEY) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  let parsedBody;
  try {
    parsedBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    console.log("Failed to parse body JSON:", error.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const validation = appointmentSchema.safeParse(parsedBody);

  if (!validation.success) {
    console.log("Validation errors:");
    validation.error.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. Path: ${err.path.join(".")}, Issue: ${err.message}`);
    });

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Validation failed",
        errors: validation.error.errors
      }),
    };
  }

  const { fullName, location, appointmentTime, car, services } = validation.data;

  // Lower the case so there are no duplicates for different case inputs. Farrish Subaru = farrish subaru
  const loweredFullName = fullName ? fullName.toLowerCase() : "";
  const loweredLocation = location ? location.toLowerCase() : "";

  console.log(`Successfully validated appointment for ${loweredFullName} at ${appointmentTime}`);

  const appointmentId = `${loweredLocation}#${appointmentTime.slice(0, 20)}`; // This was made so minute for testing, to avoid collisions during rapid multiple runs

  try {
    const existing = await dynamo.get({
      TableName: TABLE_NAME,
      Key: { appointmentId }
    }).promise();


    if (existing.Item) {
      console.log(`Conflict: Appointment already exists at ${appointmentTime} for ${existing.Item.appointmentId}`);
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: `An appointment already exists at ${appointmentTime}`
        }),
      };
    }
  } catch (error) {
    console.log("DynamoDB Get Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }

  try {
    await dynamo.put({
      TableName: TABLE_NAME,
      Item: {
        appointmentId,
        loweredFullName,
        loweredLocation,
        appointmentTime,
        car,
        services,
      }
    }).promise();
  } catch (error) {
    console.log("DynamoDB Put Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }

  // This should only be reached if there were no prior errors, and appointment successfully scheduled.
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Appointment Scheduled!",
    }),
  };
};