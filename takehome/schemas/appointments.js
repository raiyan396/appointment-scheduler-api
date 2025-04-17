const { z } = require("zod");

const appointmentSchema = z.object({
  fullName: z.string().min(1),
  location: z.string().min(1),
  appointmentTime: z.string().datetime({ offset: true }),
  car: z.string().min(1),
  services: z.array(z.string().min(1)).nonempty()
});

module.exports = { appointmentSchema };
