export const handle = async (event) => {
  return {
    statucCode: 201,
    body: JSON.stringify({
      message: "Hello World ignite Serverless",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
