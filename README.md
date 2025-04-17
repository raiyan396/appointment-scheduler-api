# Simple Appointment Scheduler API for PAM

This API allows clients to schedule unique, non-overlapping appointments for a given location and time. The system is built using Node.js, AWS Lambda, and DynamoDB, ensuring high availability and easy deployment using the Serverless Framework.

---

## Table of Contents

- [Features](#features)
- [Deployment](#deployment)
- [For Haroun](#for-haroun)
- [API Usage](#api-usage)
- [Request Body Schema](#request-body-schema)
- [API Responses](#api-responses)
- [Environment Variables](#environment-variables)
- [Internal Logic](#internal-logic)

---

## Features

- **Prevents double-booking:** No two appointments can be scheduled for the same location and time.
- **Case-insensitive normalization:** Location and full name are always stored lowercased to prevent accidental duplicates due to casing.
- **Secure:** Requires an API key for every request.
- **DynamoDB-backed:** Appointments are persisted using AWS DynamoDB.
- **Robust error handling:** Meaningful status codes and error messages for all user and system errors.

--

## Deployment

To deploy the API, make sure you have [Serverless Framework](https://www.serverless.com/) installed and configured with your AWS credentials.

Run:

```
serverless deploy
```

After deployment, you’ll see something similar to:

```
Deploying "serverless-http-api" to stage "dev" (us-east-1)

✔ Service deployed to stack serverless-http-api-dev (91s)

endpoint: POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/
functions:
  scheduleAppointment: serverless-http-api-dev-scheduleAppointment (x.xx kB)
```

## For Haroun

 To use the /takehome/test/test.js files to verify the end cases, first ensure that the .env file is populated with API_URL, as seen below, and the API_KEY. Furthermore in deployment, setting up a DynamoDB with the associated name specified (AppointmentsTable) was necessary. These can be modified in the serverless.yml file. Here is my serverless.yml file as an example:

```
org: personal123123
app: takehomepam
service: takehome

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    API_KEY: YOUR_API_KEY    # <- set your API key
    TABLE_NAME: AppointmentsTable
  iamRoleStatements: 
    - Effect: "Allow"
      Action:
        - dynamodb:GetItem
        - dynamodb:PutItem
      Resource:
        - arn:aws:dynamodb:us-east-1:*:table/AppointmentsTable

functions:
  scheduleAppointment:
    handler: handler.scheduleAppointment
    events:
      - httpApi:
          path: /appointments
          method: post

```

After obtaining the API_URL and setting the API_KEY, these should be added to the .env file as so:

```
API_KEY=YOUR_API_KEY
API_URL=https://lru2gjr24d.execute-api.us-east-1.amazonaws.com/appointments # Could change in a different deployment. This is my currently hosted lambda for this given code.
```

---
## API Usage

Deploy your API using the Serverless Framework as described above.

Set up a .env file in your project root directory with the following entries:

```
API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/
API_KEY=your_actual_api_key_here
TABLE_NAME=your_dynamodb_table_name
```

API_URL must match your deployed POST endpoint.
API_KEY must match the value set in your Lambda configuration.
Install dependencies if you haven’t already:
`npm install`
### Endpoint

```
POST / (API Gateway endpoint shown after deploy)
```

### Headers

- `Content-Type: application/json`
- `x-api-key: <your_api_key>`

### Request Body Schema

Provide the following fields as JSON:

```json
{
  "fullName": "Jane Doe",
  "location": "Farrish Subaru",
  "appointmentTime": "2023-10-20T10:00:00Z",
  "car": "Subaru Outback",
  "services": ["Oil Change", "Tire Rotation"]
}
```

**All fields are required.**  
- `appointmentTime` must be an ISO 8601 datetime string.

---

## API Responses

| Status  | Description                                      | Example payload                                  |
|---------|--------------------------------------------------|--------------------------------------------------|
| 200 OK  | Appointment scheduled                            | `{ "message": "Appointment Scheduled!" }`        |
| 400     | Validation failed or invalid JSON                | `{ "message": "Validation failed", "errors": [...] }`<br>`{ "message": "Invalid JSON body" }`|
| 401     | Missing or invalid API key                       | `{ "message": "Unauthorized" }`                  |
| 409     | Appointment slot already taken                   | `{ "message": "An appointment already exists at 2023-10-20T10:00:00Z" }`|
| 500     | Internal server/database error                   | `{ "message": "Internal Server Error" }`         |

---

## Environment Variables

- `TABLE_NAME`: Name of your DynamoDB table for storing appointments.
- `API_KEY`: Secret key required in the `x-api-key` header.
- `API_URL`: URL of the API to set to test jest testing.

---

## Internal Logic

- **API Key verification:** The function requires and validates an `x-api-key` header.
- **Body parsing & validation:** JSON body is parsed and validated for all required fields.
- **Case normalization:** Both `fullName` and `location` are transformed to lower case strings before being used for storage or comparison, ensuring uniqueness regardless of user casing.
- **Appointment uniqueness:** Appointments are uniquely identified in DynamoDB using the pattern:  
  ```
  appointmentId = `${loweredLocation}#${appointmentTime.slice(0, 20)}`
  ```
- **Pre-check for conflicts:** The function queries DynamoDB for a possible existing appointment at that time/location before inserting.
- **Error handling:** Returns appropriate error and status for validation, conflict, unauthorized, and system/database issues.

---

## Example Request

```bash
curl -X POST https://lru2gjr24d.execute-api.us-east-1.amazonaws.com/appointments \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "fullName": "Jane Doe",
    "location": "Farrish Subaru",
    "appointmentTime": "2023-10-20T10:00:00Z",
    "car": "Subaru Outback",
    "services": ["Oil Change", "Tire Rotation"]
}'
```

---

## Author

- [Raiyan Ahmad](https://github.com/serverless)

---

**For more information and to contribute, fork or open issues on GitHub.** 