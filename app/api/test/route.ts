import { redis } from "@/lib/redis";

export async function GET() {
    await redis.set("hello", "ghostspace");

    const value = await redis.get("hello")

    return Response.json({ value })
}