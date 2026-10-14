
import { grpc, proto } from "./common";

const prices: Record<string, number> = {
  PIZZA: 200,
  BURGER: 100,
  PASTA: 180,
};

const handlers = {
  calculateBill: (call: any, callback: any) => {
    const items = call.request.items;

    if (!items || items.length === 0) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Order must contain at least one item",
      });
    }

    let subtotal = 0;

    for (const item of items) {
      const price = prices[item.itemId];

      if (
        price === undefined ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: `Invalid item or quantity: ${item.itemId}`,
        });
      }

      subtotal += price * item.quantity;
    }

    const tax = Number((subtotal * 0.05).toFixed(2));

    callback(null, {
      subtotal,
      tax,
      total: Number((subtotal + tax).toFixed(2)),
      currency: "INR",
    });
  },
};

const server = new grpc.Server();

server.addService(
  proto.restaurant.BillingService.service,
  handlers
);

server.bindAsync(
  "127.0.0.1:50052",
  grpc.ServerCredentials.createInsecure(),
  (error: Error | null) => {
    if (error) throw error;
    console.log("Billing Service running on :50052");
  }
);
