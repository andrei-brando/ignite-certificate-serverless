export const handle = (event) => {
  return {
    statucCode: 201,
    body: {
      message: "Hello World ignite Serverless",
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
};
