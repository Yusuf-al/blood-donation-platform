import "dotenv/config";
import app from "./app";
import { prisma } from "./lib/prisma";
import config from "./config";

const PORT = config.port;

async function main() {
  try {
    await prisma.$connect();
    console.log("🗃️  Database is connected");
    app.listen(PORT, () => {
      console.log(`🎰 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
