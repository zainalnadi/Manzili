import 'dotenv/config'
import { PrismaClient, UserRole, PropertyType, ListingStatus, PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding Manzili database...')

  // ────────────────────────────────────────────────────────────
  // 1. Users — 2 admins, 5 hosts, 5 guests
  // ────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'Zainalnadi11@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'Zainalnadi11@gmail.com',
      fullNameAr: 'مدير النظام',
      fullNameEn: 'System Admin',
      role: 'ADMIN',
      nationalIdVerified: true,
    },
  })

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@manzili.eg' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin2@manzili.eg',
      fullNameAr: 'مسؤول ثانٍ',
      fullNameEn: 'Second Admin',
      role: 'ADMIN',
      nationalIdVerified: true,
    },
  })

  const hosts = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ahmed.host@manzili.eg' },
      update: {},
      create: {
        email: 'ahmed.host@manzili.eg',
        fullNameAr: 'أحمد السيد',
        fullNameEn: 'Ahmed El-Sayed',
        role: 'HOST',
        nationalIdVerified: true,
        phone: '+201001234567',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah.host@manzili.eg' },
      update: {},
      create: {
        email: 'sarah.host@manzili.eg',
        fullNameAr: 'سارة حسن',
        fullNameEn: 'Sarah Hassan',
        role: 'HOST',
        nationalIdVerified: true,
        phone: '+201112345678',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mona.host@manzili.eg' },
      update: {},
      create: {
        email: 'mona.host@manzili.eg',
        fullNameAr: 'منى إبراهيم',
        fullNameEn: 'Mona Ibrahim',
        role: 'HOST',
        nationalIdVerified: true,
        phone: '+201223456789',
      },
    }),
    prisma.user.upsert({
      where: { email: 'omar.host@manzili.eg' },
      update: {},
      create: {
        email: 'omar.host@manzili.eg',
        fullNameAr: 'عمر خالد',
        fullNameEn: 'Omar Khaled',
        role: 'HOST',
        nationalIdVerified: false,
        phone: '+201334567890',
      },
    }),
    prisma.user.upsert({
      where: { email: 'nour.host@manzili.eg' },
      update: {},
      create: {
        email: 'nour.host@manzili.eg',
        fullNameAr: 'نور محمود',
        fullNameEn: 'Nour Mahmoud',
        role: 'HOST',
        nationalIdVerified: true,
        phone: '+201445678901',
      },
    }),
  ])

  const guests = await Promise.all([
    prisma.user.upsert({
      where: { email: 'guest1@manzili.eg' },
      update: {},
      create: { email: 'guest1@manzili.eg', fullNameAr: 'محمد علي', fullNameEn: 'Mohamed Ali', role: 'GUEST' },
    }),
    prisma.user.upsert({
      where: { email: 'guest2@manzili.eg' },
      update: {},
      create: { email: 'guest2@manzili.eg', fullNameAr: 'فاطمة أحمد', fullNameEn: 'Fatima Ahmed', role: 'GUEST' },
    }),
    prisma.user.upsert({
      where: { email: 'guest3@manzili.eg' },
      update: {},
      create: { email: 'guest3@manzili.eg', fullNameAr: 'يوسف مصطفى', fullNameEn: 'Yousef Mostafa', role: 'GUEST' },
    }),
    prisma.user.upsert({
      where: { email: 'guest4@manzili.eg' },
      update: {},
      create: { email: 'guest4@manzili.eg', fullNameAr: 'ريم سالم', fullNameEn: 'Reem Salem', role: 'GUEST' },
    }),
    prisma.user.upsert({
      where: { email: 'guest5@manzili.eg' },
      update: {},
      create: { email: 'guest5@manzili.eg', fullNameAr: 'كريم ناصر', fullNameEn: 'Karim Nasser', role: 'GUEST' },
    }),
  ])

  console.log('✓ Users created')

  // ────────────────────────────────────────────────────────────
  // 2. Listings
  // ────────────────────────────────────────────────────────────
  const listingDefs = [
    // Cairo (5)
    {
      hostId: hosts[0].id,
      titleAr: 'شقة فاخرة في القاهرة الجديدة',
      titleEn: 'Luxury Apartment in New Cairo',
      descriptionAr: 'شقة فاخرة مفروشة بالكامل في أرقى مناطق القاهرة الجديدة. تطل على حديقة واسعة وتتمتع بإطلالات مميزة. قريبة من المولات والمطاعم.',
      descriptionEn: 'Fully furnished luxury apartment in the finest area of New Cairo. Overlooking a spacious garden with wonderful views. Close to malls and restaurants.',
      governorate: 'القاهرة', city: 'القاهرة الجديدة', compound: 'ميفيدا', latitude: 30.0131, longitude: 31.4694,
      propertyType: 'APARTMENT' as PropertyType, bedrooms: 3, bathrooms: 2, maxGuests: 6, areaSqm: 180,
      pricePerNight: 1800, weeklyDiscount: 10, monthlyDiscount: 20, cleaningFee: 300,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'parking', 'pool', 'gym', 'kitchen', 'washer', 'tv'],
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      ],
    },
    {
      hostId: hosts[1].id,
      titleAr: 'استوديو عصري في وسط القاهرة',
      titleEn: 'Modern Studio in Downtown Cairo',
      descriptionAr: 'استوديو عصري بتصميم أنيق في وسط المدينة. مثالي للسفر المنفرد أو الأزواج. على بُعد دقائق من ميدان التحرير.',
      descriptionEn: 'Modern studio with elegant design in the city center. Perfect for solo travel or couples. Minutes from Tahrir Square.',
      governorate: 'القاهرة', city: 'وسط القاهرة', compound: null, latitude: 30.0444, longitude: 31.2357,
      propertyType: 'STUDIO' as PropertyType, bedrooms: 1, bathrooms: 1, maxGuests: 2, areaSqm: 55,
      pricePerNight: 650, weeklyDiscount: 8, cleaningFee: 150,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'kitchen', 'tv', 'washer'],
      images: [
        'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      ],
    },
    {
      hostId: hosts[0].id,
      titleAr: 'بنتهاوس بإطلالة على النيل',
      titleEn: 'Penthouse with Nile View',
      descriptionAr: 'بنتهاوس فريد من نوعه بإطلالة خلابة على نهر النيل. مساحة رحبة، تشطيب سوبر لوكس، وموقع مميز في قلب القاهرة.',
      descriptionEn: 'Unique penthouse with stunning views of the Nile. Spacious layout, super luxurious finish, prime location in the heart of Cairo.',
      governorate: 'القاهرة', city: 'الزمالك', compound: null, latitude: 30.0659, longitude: 31.2195,
      propertyType: 'PENTHOUSE' as PropertyType, bedrooms: 4, bathrooms: 3, maxGuests: 8, areaSqm: 320,
      pricePerNight: 4500, weeklyDiscount: 15, monthlyDiscount: 25, cleaningFee: 600, securityDeposit: 2000,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'parking', 'pool', 'gym', 'kitchen', 'washer', 'tv', 'balcony', 'dishwasher'],
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
      ],
    },
    {
      hostId: hosts[2].id,
      titleAr: 'شقة هادئة في المعادي',
      titleEn: 'Quiet Apartment in Maadi',
      descriptionAr: 'شقة هادئة ومريحة في حي المعادي الراقي. بالقرب من المدارس الدولية والمطاعم. بيئة مثالية للعائلات.',
      descriptionEn: 'Quiet and comfortable apartment in upscale Maadi district. Near international schools and restaurants. Ideal environment for families.',
      governorate: 'القاهرة', city: 'المعادي', compound: null, latitude: 29.9605, longitude: 31.2578,
      propertyType: 'APARTMENT' as PropertyType, bedrooms: 2, bathrooms: 1, maxGuests: 4, areaSqm: 120,
      pricePerNight: 950, weeklyDiscount: 10, cleaningFee: 200,
      status: 'ACTIVE' as ListingStatus, instantBook: true,
      amenities: ['wifi', 'ac', 'parking', 'kitchen', 'washer', 'tv'],
      images: [
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      ],
    },
    {
      hostId: hosts[3].id,
      titleAr: 'شقة في مدينة نصر',
      titleEn: 'Apartment in Nasr City',
      descriptionAr: 'شقة مريحة في مدينة نصر، قريبة من المحاور الرئيسية والمول. تصميم عصري وتجهيزات متكاملة.',
      descriptionEn: 'Comfortable apartment in Nasr City, close to main roads and the mall. Modern design with full furnishings.',
      governorate: 'القاهرة', city: 'مدينة نصر', compound: null, latitude: 30.0638, longitude: 31.3419,
      propertyType: 'APARTMENT' as PropertyType, bedrooms: 2, bathrooms: 2, maxGuests: 5, areaSqm: 140,
      pricePerNight: 800, cleaningFee: 150,
      status: 'PENDING_REVIEW' as ListingStatus,
      amenities: ['wifi', 'ac', 'kitchen', 'washer', 'tv'],
      images: [
        'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=800&q=80',
      ],
    },
    // North Coast (4)
    {
      hostId: hosts[1].id,
      titleAr: 'شاليه على الشاطئ مباشرة - الساحل الشمالي',
      titleEn: 'Beachfront Chalet - North Coast',
      descriptionAr: 'شاليه فاخر على الشاطئ مباشرة في أجمل مناطق الساحل الشمالي. تمتع بالإطلالة البحرية والهواء النقي.',
      descriptionEn: 'Luxury chalet directly on the beach in the most beautiful area of the North Coast. Enjoy sea views and fresh air.',
      governorate: 'مطروح', city: 'مرسى مطروح', compound: 'هاسيندا باي', latitude: 31.1241, longitude: 27.7409,
      propertyType: 'CHALET' as PropertyType, bedrooms: 3, bathrooms: 2, maxGuests: 8, areaSqm: 200,
      pricePerNight: 3200, weeklyDiscount: 12, monthlyDiscount: 20, cleaningFee: 500, securityDeposit: 1500,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'pool', 'beach_access', 'kitchen', 'washer', 'tv', 'bbq', 'parking'],
      images: [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      ],
    },
    {
      hostId: hosts[4].id,
      titleAr: 'فيلا بمسبح خاص - الساحل الشمالي',
      titleEn: 'Villa with Private Pool - North Coast',
      descriptionAr: 'فيلا راقية بمسبح خاص في قرية سياحية متكاملة الخدمات. تحتوي على ٤ غرف نوم ومطبخ مجهز بالكامل.',
      descriptionEn: 'Upscale villa with private pool in a fully serviced resort. Features 4 bedrooms and a fully equipped kitchen.',
      governorate: 'مطروح', city: 'العلمين الجديدة', compound: 'ماراسي', latitude: 30.8389, longitude: 28.9564,
      propertyType: 'VILLA' as PropertyType, bedrooms: 4, bathrooms: 3, maxGuests: 10, areaSqm: 380,
      pricePerNight: 6500, weeklyDiscount: 15, monthlyDiscount: 25, cleaningFee: 800, securityDeposit: 3000,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'pool', 'beach_access', 'gym', 'kitchen', 'washer', 'tv', 'bbq', 'parking', 'dishwasher'],
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      ],
    },
    {
      hostId: hosts[0].id,
      titleAr: 'شاليه عائلي في الشيخ زايد',
      titleEn: 'Family Chalet in Sheikh Zayed',
      descriptionAr: 'شاليه مريح ومجهز للعائلات في قرية هادئة على الساحل. يتسع لـ ٦ أشخاص مع جميع وسائل الراحة.',
      descriptionEn: 'Comfortable and well-equipped family chalet in a quiet coastal village. Accommodates 6 people with all amenities.',
      governorate: 'مطروح', city: 'الشيخ زايد', compound: 'أوشن فيو', latitude: 31.0532, longitude: 28.0001,
      propertyType: 'CHALET' as PropertyType, bedrooms: 3, bathrooms: 2, maxGuests: 6, areaSqm: 170,
      pricePerNight: 2400, weeklyDiscount: 10, cleaningFee: 400,
      status: 'ACTIVE' as ListingStatus, instantBook: true,
      amenities: ['wifi', 'ac', 'pool', 'beach_access', 'kitchen', 'washer', 'tv', 'parking'],
      images: [
        'https://images.unsplash.com/photo-1508361727343-ca787442dcd7?w=800&q=80',
        'https://images.unsplash.com/photo-1521782462922-9318a8b43061?w=800&q=80',
      ],
    },
    {
      hostId: hosts[2].id,
      titleAr: 'شقة صيفية - رأس البر',
      titleEn: 'Summer Apartment - Ras El Bar',
      descriptionAr: 'شقة صيفية رائعة في رأس البر، على ملتقى النيل والبحر. هادئة ومريحة مع إطلالة على الماء.',
      descriptionEn: 'Wonderful summer apartment in Ras El Bar, at the confluence of the Nile and the sea. Quiet and comfortable with water views.',
      governorate: 'دمياط', city: 'رأس البر', compound: null, latitude: 31.4752, longitude: 31.8603,
      propertyType: 'APARTMENT' as PropertyType, bedrooms: 2, bathrooms: 1, maxGuests: 5, areaSqm: 100,
      pricePerNight: 1200, weeklyDiscount: 12, cleaningFee: 200,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'kitchen', 'tv', 'balcony'],
      images: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80',
      ],
    },
    // Hurghada (2)
    {
      hostId: hosts[3].id,
      titleAr: 'شقة بإطلالة بحرية - الغردقة',
      titleEn: 'Sea View Apartment - Hurghada',
      descriptionAr: 'شقة مذهلة بإطلالة مباشرة على البحر الأحمر في الغردقة. تشطيبات فاخرة ومسبح مشترك.',
      descriptionEn: 'Stunning apartment with direct view of the Red Sea in Hurghada. Luxurious finishes and shared pool.',
      governorate: 'البحر الأحمر', city: 'الغردقة', compound: 'ساوث فالي', latitude: 27.2579, longitude: 33.8116,
      propertyType: 'APARTMENT' as PropertyType, bedrooms: 2, bathrooms: 1, maxGuests: 4, areaSqm: 120,
      pricePerNight: 1500, weeklyDiscount: 10, cleaningFee: 250,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'pool', 'beach_access', 'kitchen', 'tv', 'parking'],
      images: [
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
        'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800&q=80',
      ],
    },
    {
      hostId: hosts[4].id,
      titleAr: 'فيلا فاخرة - الغردقة',
      titleEn: 'Luxury Villa - Hurghada',
      descriptionAr: 'فيلا فاخرة ببحيرة سباحة خاصة في مجمع سياحي بالغردقة. مناسبة للعائلات والمجموعات.',
      descriptionEn: 'Luxury villa with private pool in a tourist complex in Hurghada. Suitable for families and groups.',
      governorate: 'البحر الأحمر', city: 'الغردقة', compound: 'سيتي ستارز', latitude: 27.2156, longitude: 33.8463,
      propertyType: 'VILLA' as PropertyType, bedrooms: 5, bathrooms: 4, maxGuests: 12, areaSqm: 450,
      pricePerNight: 8000, weeklyDiscount: 15, monthlyDiscount: 25, cleaningFee: 1000, securityDeposit: 5000,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'pool', 'gym', 'beach_access', 'kitchen', 'washer', 'tv', 'parking', 'bbq', 'dishwasher'],
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80',
      ],
    },
    // Ain Sokhna (2)
    {
      hostId: hosts[1].id,
      titleAr: 'شاليه على الشاطئ - العين السخنة',
      titleEn: 'Beach Chalet - Ain Sokhna',
      descriptionAr: 'شاليه رومانسي على البحر مباشرة في العين السخنة. على بُعد ساعة فقط من القاهرة. مثالي لعطلة نهاية الأسبوع.',
      descriptionEn: 'Romantic chalet directly on the beach in Ain Sokhna. Just one hour from Cairo. Perfect for a weekend getaway.',
      governorate: 'السويس', city: 'العين السخنة', compound: 'لاجونا', latitude: 29.6091, longitude: 32.3525,
      propertyType: 'CHALET' as PropertyType, bedrooms: 2, bathrooms: 1, maxGuests: 5, areaSqm: 130,
      pricePerNight: 1800, weeklyDiscount: 10, cleaningFee: 300,
      status: 'ACTIVE' as ListingStatus, instantBook: true,
      amenities: ['wifi', 'ac', 'pool', 'beach_access', 'kitchen', 'tv', 'parking'],
      images: [
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
        'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=800&q=80',
      ],
    },
    {
      hostId: hosts[2].id,
      titleAr: 'فيلا تاون هاوس - العين السخنة',
      titleEn: 'Townhouse Villa - Ain Sokhna',
      descriptionAr: 'تاون هاوس أنيق بمسبح خاص في قرية متكاملة بالعين السخنة. ٣ غرف نوم وجلسة خارجية رائعة.',
      descriptionEn: 'Elegant townhouse with private pool in a fully serviced Ain Sokhna village. 3 bedrooms and a wonderful outdoor seating area.',
      governorate: 'السويس', city: 'العين السخنة', compound: 'بورتو سخنة', latitude: 29.5971, longitude: 32.3648,
      propertyType: 'TOWNHOUSE' as PropertyType, bedrooms: 3, bathrooms: 2, maxGuests: 7, areaSqm: 220,
      pricePerNight: 2800, weeklyDiscount: 12, monthlyDiscount: 18, cleaningFee: 450, securityDeposit: 1000,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'pool', 'beach_access', 'kitchen', 'washer', 'tv', 'parking', 'bbq'],
      images: [
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      ],
    },
    // Alexandria (2)
    {
      hostId: hosts[4].id,
      titleAr: 'شقة مطلة على البحر - الإسكندرية',
      titleEn: 'Sea View Apartment - Alexandria',
      descriptionAr: 'شقة فاخرة على كورنيش الإسكندرية مع إطلالة خلابة على البحر المتوسط. قريبة من المطاعم الشهيرة.',
      descriptionEn: 'Luxury apartment on Alexandria Corniche with stunning views of the Mediterranean. Close to famous restaurants.',
      governorate: 'الإسكندرية', city: 'الإسكندرية', compound: null, latitude: 31.2156, longitude: 29.9553,
      propertyType: 'APARTMENT' as PropertyType, bedrooms: 3, bathrooms: 2, maxGuests: 6, areaSqm: 160,
      pricePerNight: 1400, weeklyDiscount: 10, cleaningFee: 250,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'kitchen', 'washer', 'tv', 'balcony'],
      images: [
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
      ],
    },
    {
      hostId: hosts[3].id,
      titleAr: 'شاليه في سيدي عبد الرحمن',
      titleEn: 'Chalet in Sidi Abdel Rahman',
      descriptionAr: 'شاليه جميل في سيدي عبد الرحمن بمياه فيروزية وشاطئ رملي أبيض. تجربة لا تُنسى.',
      descriptionEn: 'Beautiful chalet in Sidi Abdel Rahman with turquoise waters and white sandy beach. An unforgettable experience.',
      governorate: 'مطروح', city: 'سيدي عبد الرحمن', compound: 'أمواج', latitude: 30.9333, longitude: 28.6000,
      propertyType: 'CHALET' as PropertyType, bedrooms: 2, bathrooms: 1, maxGuests: 4, areaSqm: 110,
      pricePerNight: 2200, weeklyDiscount: 10, cleaningFee: 350,
      status: 'ACTIVE' as ListingStatus,
      amenities: ['wifi', 'ac', 'pool', 'beach_access', 'kitchen', 'tv', 'parking'],
      images: [
        'https://images.unsplash.com/photo-1510525009512-ad7fc4a28d13?w=800&q=80',
      ],
    },
  ]

  const listings: any[] = []
  for (const def of listingDefs) {
    const { images, ...data } = def
    const listing = await prisma.listing.create({
      data: {
        ...data,
        pricePerNight: data.pricePerNight,
        cleaningFee: data.cleaningFee ?? null,
        securityDeposit: (data as any).securityDeposit ?? null,
        bnplEnabled: true,
        images: {
          create: images.map((url, i) => ({
            url,
            order: i,
            isCover: i === 0,
            altTextEn: data.titleEn,
            altTextAr: data.titleAr,
          })),
        },
      },
    })
    listings.push(listing)
  }

  console.log(`✓ ${listings.length} listings created`)

  // ────────────────────────────────────────────────────────────
  // 3. Bookings (20)
  // ────────────────────────────────────────────────────────────
  const activeListings = listings.filter((l) => listingDefs[listings.indexOf(l)]?.status === 'ACTIVE')

  const bookingDefs = [
    // Completed / paid bookings
    { listingIdx: 0, guestIdx: 0, checkIn: '2025-12-01', checkOut: '2025-12-05', nights: 4, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 1, guestIdx: 1, checkIn: '2025-12-10', checkOut: '2025-12-12', nights: 2, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'FAWRY' as PaymentMethod },
    { listingIdx: 2, guestIdx: 2, checkIn: '2025-11-15', checkOut: '2025-11-22', nights: 7, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 5, guestIdx: 3, checkIn: '2025-07-01', checkOut: '2025-07-08', nights: 7, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 6, guestIdx: 4, checkIn: '2025-08-05', checkOut: '2025-08-12', nights: 7, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'VALU_BNPL' as PaymentMethod },
    { listingIdx: 9, guestIdx: 0, checkIn: '2025-09-15', checkOut: '2025-09-20', nights: 5, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 10, guestIdx: 1, checkIn: '2025-10-01', checkOut: '2025-10-05', nights: 4, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'VODAFONE_CASH' as PaymentMethod },
    { listingIdx: 11, guestIdx: 2, checkIn: '2025-11-01', checkOut: '2025-11-04', nights: 3, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'MEEZA' as PaymentMethod },
    { listingIdx: 3, guestIdx: 3, checkIn: '2025-12-20', checkOut: '2025-12-25', nights: 5, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 7, guestIdx: 4, checkIn: '2025-10-15', checkOut: '2025-10-18', nights: 3, status: 'COMPLETED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    // Confirmed / upcoming
    { listingIdx: 0, guestIdx: 1, checkIn: '2026-01-15', checkOut: '2026-01-20', nights: 5, status: 'CONFIRMED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 5, guestIdx: 2, checkIn: '2026-07-10', checkOut: '2026-07-17', nights: 7, status: 'CONFIRMED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 6, guestIdx: 0, checkIn: '2026-08-01', checkOut: '2026-08-08', nights: 7, status: 'CONFIRMED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'VALU_BNPL' as PaymentMethod },
    { listingIdx: 11, guestIdx: 3, checkIn: '2026-03-21', checkOut: '2026-03-24', nights: 3, status: 'CONFIRMED' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    // Pending
    { listingIdx: 2, guestIdx: 4, checkIn: '2026-02-01', checkOut: '2026-02-05', nights: 4, status: 'PENDING' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 9, guestIdx: 0, checkIn: '2026-04-15', checkOut: '2026-04-20', nights: 5, status: 'PENDING' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 12, guestIdx: 1, checkIn: '2026-05-01', checkOut: '2026-05-05', nights: 4, status: 'PENDING' as BookingStatus, paymentStatus: 'CAPTURED' as PaymentStatus, paymentMethod: 'FAWRY' as PaymentMethod },
    // Cancelled
    { listingIdx: 1, guestIdx: 2, checkIn: '2025-12-01', checkOut: '2025-12-03', nights: 2, status: 'CANCELLED' as BookingStatus, paymentStatus: 'REFUNDED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
    { listingIdx: 7, guestIdx: 3, checkIn: '2025-11-20', checkOut: '2025-11-23', nights: 3, status: 'CANCELLED' as BookingStatus, paymentStatus: 'REFUNDED' as PaymentStatus, paymentMethod: 'VODAFONE_CASH' as PaymentMethod },
    { listingIdx: 0, guestIdx: 4, checkIn: '2025-10-01', checkOut: '2025-10-03', nights: 2, status: 'REJECTED' as BookingStatus, paymentStatus: 'REFUNDED' as PaymentStatus, paymentMethod: 'CARD' as PaymentMethod },
  ]

  const bookings: any[] = []
  for (const def of bookingDefs) {
    const listing = listings[def.listingIdx]
    const guest = guests[def.guestIdx]
    if (!listing || !guest) continue

    const pricePerNight = Number(listing.pricePerNight)
    const nightlyTotal = pricePerNight * def.nights
    const serviceFeeGuest = Math.round(nightlyTotal * 0.09)
    const serviceFeeHost = Math.round(nightlyTotal * 0.03)
    const cleaningFee = Number(listing.cleaningFee ?? 0)
    const totalGuestPays = nightlyTotal + serviceFeeGuest + cleaningFee
    const totalHostReceives = nightlyTotal - serviceFeeHost

    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        checkIn: new Date(def.checkIn),
        checkOut: new Date(def.checkOut),
        nights: def.nights,
        adultsCount: 2,
        nightlyTotal,
        cleaningFee,
        serviceFeeGuest,
        serviceFeeHost,
        totalGuestPays,
        totalHostReceives,
        paymentMethod: def.paymentMethod,
        paymentStatus: def.paymentStatus,
        status: def.status,
        paidAt: def.paymentStatus === 'CAPTURED' ? new Date(def.checkIn) : null,
      },
    })
    bookings.push(booking)
  }

  console.log(`✓ ${bookings.length} bookings created`)

  // Update listing totalBookings
  for (const listing of listings) {
    const count = bookings.filter((b) => b.listingId === listing.id && b.status !== 'CANCELLED' && b.status !== 'REJECTED').length
    if (count > 0) {
      await prisma.listing.update({ where: { id: listing.id }, data: { totalBookings: count } })
    }
  }

  // ────────────────────────────────────────────────────────────
  // 4. Reviews (15 — for completed bookings only)
  // ────────────────────────────────────────────────────────────
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').slice(0, 10)

  const reviewTexts = [
    { en: 'Excellent property! Clean, spacious, and exactly as described. Will definitely return.', ar: 'عقار ممتاز! نظيف وواسع ومطابق تماماً للوصف. سأعود بالتأكيد.' },
    { en: 'Great location and very comfortable. The host was responsive and helpful throughout.', ar: 'موقع رائع ومريح جداً. كان المضيف متجاوباً ومفيداً طوال الوقت.' },
    { en: 'Beautiful views and a wonderful experience. The amenities were top notch.', ar: 'إطلالات جميلة وتجربة رائعة. كانت المرافق من الدرجة الأولى.' },
    { en: 'Perfect for families! The kids loved it and everything was as expected.', ar: 'مثالي للعائلات! أحب الأطفال المكان وكان كل شيء كما هو متوقع.' },
    { en: 'Stunning property right on the beach. One of the best stays I have had.', ar: 'عقار رائع مباشرة على الشاطئ. من أفضل إقاماتي على الإطلاق.' },
    { en: 'Very clean and well-maintained. The check-in process was smooth and easy.', ar: 'نظيف جداً ومصون بشكل جيد. كانت عملية تسجيل الوصول سلسة وسهلة.' },
    { en: 'Highly recommend this place! Exceeded all my expectations in every way.', ar: 'أنصح بهذا المكان بشدة! تجاوز كل توقعاتي بكل الطرق.' },
    { en: 'Cozy and charming property. Great value for money in an excellent location.', ar: 'عقار مريح وساحر. قيمة ممتازة مقابل المال في موقع رائع.' },
    { en: 'The pool was amazing and the views were breathtaking. Perfect holiday.', ar: 'كانت حمام السباحة رائعاً والمناظر خلابة. عطلة مثالية.' },
    { en: 'Would absolutely come back! Great property, great host, great experience.', ar: 'سأعود بالتأكيد! عقار رائع ومضيف رائع وتجربة رائعة.' },
  ]

  for (let i = 0; i < completedBookings.length; i++) {
    const booking = completedBookings[i]
    const text = reviewTexts[i % reviewTexts.length]
    const ratings = [4, 5, 5, 4, 5, 5, 4, 5, 5, 4]
    const r = ratings[i % ratings.length]

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        listingId: booking.listingId,
        authorId: booking.guestId,
        overallRating: r,
        cleanlinessRating: r,
        accuracyRating: Math.max(r - 1, 3),
        locationRating: 5,
        valueRating: r,
        commentEn: text.en,
        commentAr: text.ar,
        isVisible: true,
      },
    })
  }

  // Update listing average ratings
  for (const listing of listings) {
    const reviews = await prisma.review.findMany({ where: { listingId: listing.id } })
    if (reviews.length > 0) {
      const avg = reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
      await prisma.listing.update({ where: { id: listing.id }, data: { averageRating: Math.round(avg * 10) / 10 } })
    }
  }

  console.log('✓ Reviews created and ratings updated')
  console.log('\n🎉 Seed complete!')
  console.log(`   Admin login: Zainalnadi11@gmail.com`)
  console.log(`   Hosts:       ahmed.host@manzili.eg ... nour.host@manzili.eg`)
  console.log(`   Guests:      guest1@manzili.eg ... guest5@manzili.eg`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
