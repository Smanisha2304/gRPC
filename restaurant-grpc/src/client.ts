
import { grpc, proto } from "./common";


// grpc.credentials.createInsecure() is used in gRPC to create a connection without encryption 
// (TLS/SSL) between a client and a server.
const client = new proto.restaurant.OrderService(
  "127.0.0.1:50053",
  grpc.credentials.createInsecure() 
//   The client needs credentials to connect to the server. createInsecure()
//  tells gRPC to establish the connection without TLS encryption.
);

client.placeOrder(
  {
    customerName: "Manisha",
    items: [
      { itemId: "PIZZA", quantity: 2 },
      { itemId: "BURGER", quantity: 1 },
    ],
  },
  (error: any, response: any) => {
    if (error) {
      console.error("Order failed:", error.message);
      return;
    }

    console.log("Order response:");
    console.log(JSON.stringify(response, null, 2));

    // Test GetOrder using the returned ID.
    client.getOrder(
      { orderId: response.orderId },
      (getError: any, order: any) => {
        if (getError) {
          console.error("Get order failed:", getError.message);
          return;
        }

        console.log("Retrieved order:");
        console.log(JSON.stringify(order, null, 2));

        client.close();
      }
    );
  }
);
