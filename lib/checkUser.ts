import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
    try {
        const user = await currentUser();

        // 1. If no Clerk session, exit early
        if (!user) {
            return null;
        }

        // 2. Check if user already exists in our Postgres DB
        const loggedInUser = await db.user.findUnique({
            where: {
                clerkUserId: user.id,
            },
        });

        if (loggedInUser) {
            return loggedInUser;
        }

        // 3. Create new user if they don't exist
        // Added safety check for email
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) {
            console.error("User creation failed: No email address found in Clerk profile.");
            return null;
        }

        const newUser = await db.user.create({
            data: {
                clerkUserId: user.id,
                name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || "Valued Member",
                imageUrl: user.imageUrl,
                email: email,
            }
        });

        return newUser;
    } catch (error) {
        console.error("Error in checkUser utility:", error);
        return null;
    }
}