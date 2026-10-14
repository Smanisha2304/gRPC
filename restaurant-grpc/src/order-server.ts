
import { grpc, proto } from "./common";

const restaurant = new proto.restaurant.RestaurantService(
  "127.0.0.1:50051",
  grpc.credentials.createInsecure()
);

const billing = new proto.restaurant.BillingService(
  "127.0.0.1:50052",
  grpc.credentials.createInsecure()
);

const orders = new Map<string, any>();
let nextOrderNumber = 1001;

const handlers = {
  placeOrder: async (call: any, callback: any) => {
    const { customerName, items } = call.request;

    if (!customerName || !items?.length) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Customer name and items are required",
      });
    }

    try {
      // Step 1: Check each item with Restaurant Service.
      for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Quantity must be a positive integer",
          });
        }

        const result: any = await new Promise((resolve, reject) => {
          restaurant.checkAvailability(item, (err: any, response: any) => {
            if (err) reject(err);
            else resolve(response);
          });
        });

        if (!result.available) {
          return callback({
            code: grpc.status.FAILED_PRECONDITION,
            message: result.message,
          });
        }
      }

      // Step 2: Ask Billing Service to calculate the bill.
      const bill: any = await new Promise((resolve, reject) => {
        billing.calculateBill({ items }, (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response);
        });
      });

      // Step 3: Create and store the order.
      const orderId = `ORD-${nextOrderNumber++}`;

      const order = {
        orderId,
        customerName,
        status: "CONFIRMED",
        bill,
      };

      orders.set(orderId, order);

      console.log("Order created:", orderId);

      callback(null, order);
    } catch (error: any) {
      callback({
        code: error.code ?? grpc.status.INTERNAL,
        message: error.message ?? "Unable to place order",
      });
    }
  },

  getOrder: (call: any, callback: any) => {
    const order = orders.get(call.request.orderId);

    if (!order) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Order not found",
      });
    }

    callback(null, order);
  },
};

const server = new grpc.Server();

server.addService(
  proto.restaurant.OrderService.service,
  handlers
);

server.bindAsync(
  "127.0.0.1:50053",
  grpc.ServerCredentials.createInsecure(),
  (error: Error | null) => {
    if (error) throw error;
    console.log("Order Service running on :50053");
  }
);
