import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hashPassword } from 'better-auth/crypto';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log('🌱 Starting database seeding...');

    const upsertCredentialAccount = async (
        userId: string,
        email: string,
        passwordHash: string
    ) => {
        await prisma.account.upsert({
            where: {
                providerId_accountId: {
                    providerId: 'credential',
                    accountId: email,
                },
            },
            update: {
                userId,
                password: passwordHash,
            },
            create: {
                userId,
                providerId: 'credential',
                accountId: email,
                password: passwordHash,
            },
        });
    };

    // Create Admin User
    const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'Admin@123');
    const admin = await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'admin@medistore.com' },
        update: {
            password: adminPassword,
            emailVerified: true,
            role: UserRole.ADMIN,
            isActive: true,
        },
        create: {
            email: process.env.ADMIN_EMAIL || 'admin@medistore.com',
            password: adminPassword,
            role: UserRole.ADMIN,
            name: 'Admin User',
            phone: '+1234567890',
            address: 'Admin Office, MediStore HQ',
            emailVerified: true,
            isActive: true,
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create Categories
    const categories = [
        { name: 'Pain Relief', description: 'Medicines for pain management and relief' },
        { name: 'Cold & Flu', description: 'Treatments for cold, cough, and flu symptoms' },
        { name: 'Vitamins & Supplements', description: 'Essential vitamins and dietary supplements' },
        { name: 'Digestive Health', description: 'Medicines for digestive issues' },
        { name: 'First Aid', description: 'First aid and wound care products' },
        { name: 'Allergy Relief', description: 'Antihistamines and allergy medications' },
        { name: 'Skin Care', description: 'Topical treatments and skin care products' },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
    }
    console.log('✅ Categories created:', categories.length);

    // Create Sample Seller
    const sellerPassword = await hashPassword('Seller@123');
    const seller = await prisma.user.upsert({
        where: { email: 'seller@medistore.com' },
        update: {
            password: sellerPassword,
            emailVerified: true,
            role: UserRole.SELLER,
            isActive: true,
        },
        create: {
            email: 'seller@medistore.com',
            password: sellerPassword,
            role: UserRole.SELLER,
            name: 'Sample Pharmacy',
            phone: '+1234567891',
            address: '123 Pharmacy Street, Medical District',
            emailVerified: true,
            isActive: true,
        },
    });
    console.log('✅ Sample seller created:', seller.email);

    // Get category IDs
    const painReliefCat = await prisma.category.findUnique({ where: { name: 'Pain Relief' } });
    const coldFluCat = await prisma.category.findUnique({ where: { name: 'Cold & Flu' } });
    const vitaminsCat = await prisma.category.findUnique({ where: { name: 'Vitamins & Supplements' } });
    const digestiveCat = await prisma.category.findUnique({ where: { name: 'Digestive Health' } });
    const allergyCat = await prisma.category.findUnique({ where: { name: 'Allergy Relief' } });

    // Create Sample Medicines
    const medicines = [
        {
            name: 'Paracetamol 500mg',
            description: 'Effective pain relief and fever reducer. 24 tablets per pack.',
            price: 5.99,
            stock: 100,
            manufacturer: 'PharmaCorp',
            categoryId: painReliefCat!.id,
            sellerId: seller.id,
        },
        {
            name: 'Ibuprofen 400mg',
            description: 'Anti-inflammatory pain reliever. 20 tablets per pack.',
            price: 7.49,
            stock: 75,
            manufacturer: 'MediPharm',
            categoryId: painReliefCat!.id,
            sellerId: seller.id,
        },
        {
            name: 'Cough Syrup',
            description: 'Relieves cough and soothes throat. 100ml bottle.',
            price: 8.99,
            stock: 50,
            manufacturer: 'HealthPlus',
            categoryId: coldFluCat!.id,
            sellerId: seller.id,
        },
        {
            name: 'Vitamin C 1000mg',
            description: 'Immune system support. 30 tablets per bottle.',
            price: 12.99,
            stock: 120,
            manufacturer: 'VitaLife',
            categoryId: vitaminsCat!.id,
            sellerId: seller.id,
        },
        {
            name: 'Multivitamin Complex',
            description: 'Complete daily multivitamin. 60 tablets per bottle.',
            price: 18.99,
            stock: 80,
            manufacturer: 'VitaLife',
            categoryId: vitaminsCat!.id,
            sellerId: seller.id,
        },
        {
            name: 'Antacid Tablets',
            description: 'Fast relief from heartburn and indigestion. 30 tablets.',
            price: 6.49,
            stock: 90,
            manufacturer: 'DigestCare',
            categoryId: digestiveCat!.id,
            sellerId: seller.id,
        },
        {
            name: 'Antihistamine 10mg',
            description: 'Allergy relief for hay fever and allergies. 14 tablets.',
            price: 9.99,
            stock: 60,
            manufacturer: 'AllergyFree',
            categoryId: allergyCat!.id,
            sellerId: seller.id,
        },
    ];

    for (const medicine of medicines) {
        await prisma.medicine.create({ data: medicine });
    }
    console.log('✅ Sample medicines created:', medicines.length);

    // Create Sample Customer
    const customerPassword = await hashPassword('Customer@123');
    const customer = await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {
            password: customerPassword,
            emailVerified: true,
            role: UserRole.CUSTOMER,
            isActive: true,
        },
        create: {
            email: 'customer@example.com',
            password: customerPassword,
            role: UserRole.CUSTOMER,
            name: 'John Doe',
            phone: '+1234567892',
            address: '456 Customer Lane, City Center',
            emailVerified: true,
            isActive: true,
        },
    });
    console.log('✅ Sample customer created:', customer.email);

    await upsertCredentialAccount(admin.id, admin.email, adminPassword);
    await upsertCredentialAccount(seller.id, seller.email, sellerPassword);
    await upsertCredentialAccount(customer.id, customer.email, customerPassword);
    console.log('✅ Credential accounts synced for test users');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('Admin: admin@medistore.com / Admin@123');
    console.log('Seller: seller@medistore.com / Seller@123');
    console.log('Customer: customer@example.com / Customer@123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
