import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function seed() {
    console.log("🌱 بدء تهيئة قاعدة البيانات...");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { nationalId: "00000000001" },
        update: {},
        create: {
            nationalId: "00000000001",
            fullName: "مدير النظام",
            email: "admin@dsit.gov.sy",
            phone: "0999999999",
            password: adminPassword,
            role: "ADMIN",
            status: "APPROVED",
            region: "center",
        },
    });
    console.log("✅ تم إنشاء حساب المدير:", admin.fullName);

    // Create sample citizen
    const citizenPassword = await bcrypt.hash("citizen123", 12);
    const citizen = await prisma.user.upsert({
        where: { nationalId: "12345678901" },
        update: {},
        create: {
            nationalId: "12345678901",
            fullName: "أحمد محمد الأحمد",
            email: "ahmed@example.com",
            phone: "0988888888",
            password: citizenPassword,
            role: "USER",
            status: "APPROVED",
            region: "center",
        },
    });
    console.log("✅ تم إنشاء حساب المواطن:", citizen.fullName);

    // Create distributor
    const distPassword = await bcrypt.hash("dist123", 12);
    const distributor = await prisma.user.upsert({
        where: { nationalId: "22222222222" },
        update: {},
        create: {
            nationalId: "22222222222",
            fullName: "خالد الموزع",
            email: "distributor@dsit.gov.sy",
            password: distPassword,
            role: "DISTRIBUTOR",
            status: "APPROVED",
            region: "center",
        },
    });
    console.log("✅ تم إنشاء حساب الموزع:", distributor.fullName);

    // Create inspector
    const inspPassword = await bcrypt.hash("insp123", 12);
    const inspector = await prisma.user.upsert({
        where: { nationalId: "33333333333" },
        update: {},
        create: {
            nationalId: "33333333333",
            fullName: "سامر المفتش",
            email: "inspector@dsit.gov.sy",
            password: inspPassword,
            role: "INSPECTOR",
            status: "APPROVED",
            region: "center",
        },
    });
    console.log("✅ تم إنشاء حساب المفتش:", inspector.fullName);

    // Create family book for citizen
    const familyBook = await prisma.familyBook.upsert({
        where: { headOfFamilyId: citizen.id },
        update: {},
        create: {
            bookNumber: "FB-001-2026",
            headOfFamilyId: citizen.id,
            region: "center",
            address: "السويداء - المركز",
            members: {
                create: [
                    { fullName: "سارة أحمد", nationalId: "12345678902", relationship: "زوجة" },
                    { fullName: "محمد أحمد", relationship: "ابن", birthDate: new Date("2015-03-15") },
                    { fullName: "ريم أحمد", relationship: "ابنة", birthDate: new Date("2018-07-20") },
                ],
            },
        },
    });
    console.log("✅ تم إنشاء دفتر العائلة:", familyBook.bookNumber);

    // Create allocation categories
    const breadCategory = await prisma.allocationCategory.upsert({
        where: { id: "bread" },
        update: {},
        create: {
            id: "bread",
            name: "bread",
            nameAr: "خبز",
            type: "FAMILY",
            unit: "loaf",
            baseQuota: 5,
            quotaPerPerson: 3,
            description: "مخصصات الخبز اليومية حسب عدد أفراد العائلة",
            isActive: true,
        },
    });

    const gasCategory = await prisma.allocationCategory.upsert({
        where: { id: "gas" },
        update: {},
        create: {
            id: "gas",
            name: "gas",
            nameAr: "غاز منزلي",
            type: "FAMILY",
            unit: "cylinder",
            baseQuota: 1,
            quotaPerPerson: 0,
            description: "أسطوانة غاز شهرية لكل عائلة",
            isActive: true,
        },
    });

    const fuelCategory = await prisma.allocationCategory.upsert({
        where: { id: "fuel" },
        update: {},
        create: {
            id: "fuel",
            name: "fuel",
            nameAr: "محروقات",
            type: "INDIVIDUAL",
            unit: "liter",
            baseQuota: 50,
            description: "مخصصات الوقود الشهرية حسب المركبة المسجلة",
            isActive: true,
        },
    });

    const sugarCategory = await prisma.allocationCategory.upsert({
        where: { id: "sugar" },
        update: {},
        create: {
            id: "sugar",
            name: "sugar",
            nameAr: "سكر",
            type: "FAMILY",
            unit: "kg",
            baseQuota: 2,
            quotaPerPerson: 0.5,
            description: "مخصصات السكر الشهرية",
            isActive: true,
        },
    });

    await prisma.allocationCategory.upsert({
        where: { id: "rice" },
        update: {},
        create: {
            id: "rice",
            name: "rice",
            nameAr: "أرز",
            type: "FAMILY",
            unit: "kg",
            baseQuota: 3,
            quotaPerPerson: 1,
            description: "مخصصات الأرز الشهرية",
            isActive: true,
        },
    });

    console.log("✅ تم إنشاء أنواع المخصصات: خبز، غاز، محروقات، سكر، أرز");

    // Clean up existing data for re-runs (order matters for foreign keys)
    await prisma.transaction.deleteMany({});
    await prisma.allocation.deleteMany({});
    await prisma.allocationPeriod.deleteMany({});
    await prisma.distributionCenter.deleteMany({});
    await prisma.vehicleRegistration.deleteMany({});

    // Create allocation periods
    const breadPeriod = await prisma.allocationPeriod.create({
        data: {
            categoryId: breadCategory.id,
            name: "مارس 2026",
            startDate: new Date("2026-03-01"),
            endDate: new Date("2026-03-31"),
            status: "ACTIVE",
        },
    });

    const gasPeriod = await prisma.allocationPeriod.create({
        data: {
            categoryId: gasCategory.id,
            name: "مارس 2026",
            startDate: new Date("2026-03-01"),
            endDate: new Date("2026-03-31"),
            status: "ACTIVE",
        },
    });

    const fuelPeriod = await prisma.allocationPeriod.create({
        data: {
            categoryId: fuelCategory.id,
            name: "مارس 2026",
            startDate: new Date("2026-03-01"),
            endDate: new Date("2026-03-31"),
            status: "ACTIVE",
        },
    });

    const sugarPeriod = await prisma.allocationPeriod.create({
        data: {
            categoryId: sugarCategory.id,
            name: "مارس 2026",
            startDate: new Date("2026-03-01"),
            endDate: new Date("2026-03-31"),
            status: "ACTIVE",
        },
    });

    console.log("✅ تم إنشاء فترات المخصصات");

    // Create allocations for citizen (family of 4: head + 3 members)
    const memberCount = 4;
    await prisma.allocation.createMany({
        data: [
            {
                periodId: breadPeriod.id,
                userId: citizen.id,
                familyBookId: familyBook.id,
                totalQuota: breadCategory.baseQuota + (breadCategory.quotaPerPerson || 0) * memberCount,
                remainingQuota: breadCategory.baseQuota + (breadCategory.quotaPerPerson || 0) * memberCount,
            },
            {
                periodId: gasPeriod.id,
                userId: citizen.id,
                familyBookId: familyBook.id,
                totalQuota: gasCategory.baseQuota,
                remainingQuota: gasCategory.baseQuota,
            },
            {
                periodId: fuelPeriod.id,
                userId: citizen.id,
                totalQuota: fuelCategory.baseQuota,
                remainingQuota: fuelCategory.baseQuota,
            },
            {
                periodId: sugarPeriod.id,
                userId: citizen.id,
                familyBookId: familyBook.id,
                totalQuota: sugarCategory.baseQuota + (sugarCategory.quotaPerPerson || 0) * memberCount,
                remainingQuota: sugarCategory.baseQuota + (sugarCategory.quotaPerPerson || 0) * memberCount,
            },
        ],
    });
    console.log("✅ تم إنشاء مخصصات المواطن");

    // Create distribution centers
    await prisma.distributionCenter.create({
        data: {
            name: "فرن السويداء المركزي",
            type: "BAKERY",
            address: "السويداء - الشارع الرئيسي",
            region: "center",
            isActive: true,
            inspectorId: inspector.id,
        },
    });

    await prisma.distributionCenter.create({
        data: {
            name: "محطة غاز الشمال",
            type: "GAS_STATION",
            address: "السويداء - المنطقة الشمالية",
            region: "north",
            isActive: true,
        },
    });

    await prisma.distributionCenter.create({
        data: {
            name: "مركز التموين الرئيسي",
            type: "SUPPLY_CENTER",
            address: "السويداء - المركز",
            region: "center",
            isActive: true,
        },
    });

    console.log("✅ تم إنشاء مراكز التوزيع");

    // Create vehicle registration
    await prisma.vehicleRegistration.create({
        data: {
            userId: citizen.id,
            plateNumber: "123-456",
            vehicleType: "sedan",
            fuelType: "GASOLINE",
            engineSize: 1.6,
        },
    });
    console.log("✅ تم تسجيل مركبة المواطن");

    console.log("\n🎉 تم تهيئة قاعدة البيانات بنجاح!");
    console.log("\n📝 حسابات الدخول:");
    console.log("   مدير: admin@dsit.gov.sy / admin123");
    console.log("   مواطن: 12345678901 / citizen123");
    console.log("   موزع: 22222222222 / dist123");
    console.log("   مفتش: 33333333333 / insp123");
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
