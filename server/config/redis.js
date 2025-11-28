import Redis from "ioredis";

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    tls: {},
  });
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  });
}

redis.on("connect", () => {
  console.log("🔗 Redis connected");
});

redis.on("error", (err) => {
  console.log("❌ Redis error:", err.message);
});

export default redis;

