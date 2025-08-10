import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "DEACTIVATED"] as const;
const PPWR_LEVELS = ["Stufe 1", "Stufe 2", "Stufe 3", "Stufe 4"] as const;
const MATERIALS = ["PET", "HDPE", "LDPE", "PP", "PS", "PVC"] as const;
const FORMATS = ["Cup", "Bottle", "Tray", "Bag", "Container", "Tube"] as const;
const SUPPLIERS = [
   "ACME Inc.",
   "Global Packaging",
   "EcoPack",
   "InnoContainer",
   "SustainSolutions",
] as const;
const MANUFACTURING_PROCESSES = [
   "Thermoforming",
   "Injection Molding",
   "Blow Molding",
   "Extrusion",
   "Compression Molding",
] as const;
const COLORS = [
   "Green",
   "Blue",
   "Red",
   "White",
   "Black",
   "Transparent",
] as const;

async function seedPackagingItems() {
   console.log("Starting seeding...");

   // Clear existing data
   await prisma.packagingDocument.deleteMany();
   await prisma.packagingComponent.deleteMany();
   await prisma.packagingItem.deleteMany();

   // Seed 50 packaging items
   for (let i = 0; i < 50; i++) {
      const packagingItem = await prisma.packagingItem.create({
         data: {
            name: `${faker.commerce.productName()} Packaging`,
            internalCode: `FL${faker.string.numeric(4)}`,
            materials: faker.helpers.arrayElements(MATERIALS, {
               min: 1,
               max: 3,
            }),
            status: faker.helpers.arrayElement(STATUSES),
            weight: `${faker.number.int({ min: 100, max: 1000 })}g`,
            ppwrLevel: faker.helpers.arrayElement(PPWR_LEVELS),
            components: {
               create: Array.from(
                  { length: faker.number.int({ min: 1, max: 3 }) },
                  () => ({
                     name: faker.commerce.productName(),
                     format: faker.helpers.arrayElement(FORMATS),
                     weight: `${faker.number.int({ min: 50, max: 500 })}g`,
                     volume: `${faker.number.int({ min: 100, max: 500 })}ml`,
                     ppwrCategory: `Category ${faker.number.int({
                        min: 1,
                        max: 5,
                     })}`,
                     ppwrLevel: faker.helpers.arrayElement(PPWR_LEVELS),
                     quantity: faker.number.int({ min: 1, max: 10 }),
                     supplier: faker.helpers.arrayElement(SUPPLIERS),
                     manufacturingProcess: faker.helpers.arrayElement(
                        MANUFACTURING_PROCESSES
                     ),
                     color: faker.helpers.arrayElement(COLORS),
                  })
               ),
            },
            documents: {
               create: faker.datatype.boolean()
                  ? [
                       {
                          name: `${faker.system.fileName()}.pdf`,
                          type: "CONFORMITY_DECLARATION",
                          fileUrl: faker.internet.url(),
                          fileSize: faker.number.int({
                             min: 1000,
                             max: 3000000,
                          }),
                       },
                    ]
                  : [],
            },
         },
      });

      console.log(`Created packaging item: ${packagingItem.name}`);
   }

   console.log("Seeding completed successfully!");
}

seedPackagingItems()
   .catch((e) => {
      console.error("Error during seeding:", e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
