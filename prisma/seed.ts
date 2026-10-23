import { PrismaClient, UserRole, EventStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const eventSeed = [
  ["The Monsoon Sessions", "Music", "Bengaluru", "Courtyard by the Lake", 899],
  ["Objects of Tomorrow", "Art & culture", "Mumbai", "The Design District", 350],
  ["Supper Club: Coastal", "Food & drink", "Chennai", "Salt House, Besant Nagar", 1200],
  ["City on Two Wheels", "Outdoors", "Pune", "Shaniwar Wada Gate", 250],
  ["Small Worlds Film Night", "Film", "Bengaluru", "Ranga Shankara", 500],
  ["Good Things Grow Here", "Art & culture", "Kochi", "Pepper House, Fort Kochi", 0],
  ["After Hours / Live", "Music", "Mumbai", "antiSOCIAL, Lower Parel", 1500],
  ["The Sunday Table", "Food & drink", "Pune", "Moshi Moshi Studio", 950],
  ["A Walk Through Old Kochi", "Outdoors", "Kochi", "Parade Ground", 300],
  ["Soft Focus: Indie Shorts", "Film", "Chennai", "Theatre Marina", 400],
] as const;

async function main() {
  const commonPassword = process.env.SEED_TEST_PASSWORD;
  if (!commonPassword || commonPassword.length < 12) throw new Error("Set SEED_TEST_PASSWORD to at least 12 characters before running the seed.");
  const passwordHash = await bcrypt.hash(commonPassword, 12);
  const [attendee, organizer] = await Promise.all([
    prisma.user.upsert({ where: { email: "attendee@sidestage.test" }, update: { passwordHash, isEmailVerified: true }, create: { email: "attendee@sidestage.test", name: "Aarav Menon", role: UserRole.ATTENDEE, passwordHash, isEmailVerified: true } }),
    prisma.user.upsert({ where: { email: "organizer@sidestage.test" }, update: { passwordHash, isEmailVerified: true }, create: { email: "organizer@sidestage.test", name: "Mira Rao", role: UserRole.ORGANIZER, passwordHash, isEmailVerified: true } }),
  ]);
  await prisma.user.upsert({ where: { email: "admin@sidestage.test" }, update: { passwordHash, isEmailVerified: true }, create: { email: "admin@sidestage.test", name: "Side Stage Admin", role: UserRole.ADMIN, passwordHash, isEmailVerified: true } });

  for (const [index, [title, category, city, venue, price]] of eventSeed.entries()) {
    await prisma.event.upsert({
      where: { id: `seed-event-${index + 1}` },
      update: {},
      create: {
        id: `seed-event-${index + 1}`,
        organizerId: organizer.id,
        title,
        description: `${title} brings a small group together for a memorable ${category.toLowerCase()} experience in ${city}.`,
        category,
        city,
        venue,
        startsAt: new Date(Date.now() + (7 + index * 3) * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + (7 + index * 3) * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        status: EventStatus.PUBLISHED,
        ticketTypes: { create: [{ name: "General admission", priceCents: price * 100, capacity: 120, salesOpenAt: new Date(), salesCloseAt: new Date(Date.now() + (6 + index * 3) * 24 * 60 * 60 * 1000) }] },
      },
    });
  }

  console.info(`Seeded attendee ${attendee.email}, organizer ${organizer.email}, admin admin@sidestage.test, and ${eventSeed.length} events.`);
}

main().finally(async () => prisma.$disconnect());