    import { currentUser } from "@clerk/nextjs/server";
    import { db } from "@/lib/prisma";

    export const checkUser = async () => {
        try {
            const user = await currentUser();

            if (!user) {
                console.log("Checking User: No Clerk session found.");
                return null;
            }

            console.log(`Checking User: Found Clerk user ${user.id}. Querying DB...`);

            const loggedInUser = await db.user.findUnique({
                where: { clerkUserId: user.id },
            });

            if (loggedInUser) {
                console.log("Checking User: User exists in Postgres.");
                return loggedInUser;
            }

            console.log("Checking User: Creating new user in Postgres...");

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