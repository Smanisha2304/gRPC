
import { grpc, proto } from "./common";

const menu = [
  {
    id: "PIZZA",
    name: "Pizza",
    price: 200,
    available: true,
  },
  {
    id: "BURGER",
    name: "Burger",
    price: 100,
    available: true,
  },
  {
    id: "PASTA",
    name: "Pasta",
    price: 180,
    available: true,
  },
];

const handlers = {
  getMenu: (_call: any, callback: any) => {
    callback(null, { items: menu });
  },

  checkAvailability: (call: any, callback: any) => {
    const { itemId, quantity } = call.request;
    const item = menu.find((i) => i.id === itemId);

    if (!item || !item.available || quantity <= 0) {
      return callback(null, {
        available: false,
        message: "Item unavailable or invalid quantity",
      });
    }

    callback(null, {
      available: true,
      message: `${item.name} is available`,
    });
  },
};

const server = new grpc.Server();

server.addService(
  proto.restaurant.RestaurantService.service,
  handlers
);

server.bindAsync(
  "127.0.0.1:50051",
  grpc.ServerCredentials.createInsecure(),
  (error: Error | null) => {
    if (error) throw error;
    console.log("Restaurant Service running on :50051");
  }
);
