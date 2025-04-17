const { scheduleAppointment } = require('../handler');
require("dotenv").config();
const axios = require("axios");

const API_URL = process.env.API_URL
const API_KEY = process.env.API_KEY

// End to end tests for production
const validBody = {
    fullName: "Jane Doe",
    location: "Farrish Subaru",
    appointmentTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes into future
    car: "Subaru Outback",
    services: ["Oil Change", "Tire Rotation"]
};

// Needed as we don't want to immediately check for the entry done for the 200 req
const validBody2 = {
    fullName: "Jane Doe",
    location: "Farrish Subaru",
    appointmentTime: new Date(Date.now() + 11 * 60 * 1000).toISOString(), // 10 minutes into future
    car: "Subaru Outback",
    services: ["Oil Change", "Tire Rotation"]
};

const validBody3 = {
    fullName: "Jane Doe",
    location: "Farrish Subaru",
    appointmentTime: new Date(Date.now() + 13 * 60 * 1000).toISOString(), // 10 minutes into future
    car: "Subaru Outback",
    services: ["Oil Change", "Tire Rotation"]
};
  
const invalidBody = {
    // missing fullName
    location: "Farrish Subaru",
    appointmentTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    car: "Subaru Outback",
    services: ["Oil Change", "Tire Rotation"]
};
  
  describe("Appointment API E2E Tests", () => {
    it("should create a new appointment (200 OK)", async () => {
      const response = await axios.post(API_URL, validBody, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        }
      });
  
      expect(response.status).toBe(200);
      expect(response.data.message).toMatch(/Scheduled/i);
    });
  
    it("should reject incorrect fields such as name with int (400 bad request)", async () => {
      try {
        const invalidBody = {
            fullName: 1234,
            location: "Farrish Subaru",
            appointmentTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            car: "Subaru Outback",
            services: ["Oil Change", "Tire Rotation"]
        };
        await axios.post(API_URL, invalidBody, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toMatch(/Validation failed/i);
      }
    });

    it("should reject missing fields (400 Bad Request) (empty body)", async () => {
        try {
          const invalidBody = {};
          await axios.post(API_URL, invalidBody, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY
            }
          });
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.message).toMatch(/Validation failed/i);
        }
    });

    it("should reject missing fields (400 Bad Request)", async () => {
        try {
          await axios.post(API_URL, invalidBody, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY
            }
          });
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.message).toMatch(/Validation failed/i);
        }
      });

    it("should reject missing API key (401 Unauthorized)", async () => {
      try {
        await axios.post(API_URL, validBody, {
          headers: {
            "Content-Type": "application/json"
            // no x-api-key here
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toMatch(/Unauthorized/i);
      }
    });

    it("should reject wrong API key (401 Unauthorized)", async () => {
        try {
          await axios.post(API_URL, validBody, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": "wrong-api-key"
            }
          });
        } catch (error) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.message).toMatch(/Unauthorized/i);
        }
      });
  
    it("should return 409 Conflict if appointment already exists", async () => {
        // First creation should succeed
        await axios.post(API_URL, validBody2, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
          }
        });
      
        // Second creation (same time/location) should fail with 409
        try {
          await axios.post(API_URL, validBody2, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY
            }
          });
          throw new Error("Expected 409 error, but request succeeded");
        } catch (error) {
          expect(error.response.status).toBe(409);
        }
      });

      it("should return 409 Conflict if appointment already exists even with different casing", async () => {
        // First creation should succeed
        await axios.post(API_URL, validBody3, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
          }
        });
      
        // Second creation (same time/location) should fail with 409, different capitalization
        try {
            validBody3.location = "Farrish subaru"
          await axios.post(API_URL, validBody3, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY
            }
          });
          throw new Error("Expected 409 error, but request succeeded");
        } catch (error) {
            console.log(error)
            expect(error.response.status).toBe(409);
        }
    });
});