import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Products ───────────────────────────────────────────────────────────────

  const products = [
    {
      name: 'Teja Chilli',
      slug: 'teja-chilli',
      variety: 'S17',
      shuMin: 50000,
      shuMax: 80000,
      astaValue: '35–40 ASTA',
      moisture: '≤ 12%',
      description:
        'The benchmark Guntur export chilli. S17 Teja is prized worldwide for its intense pungency, vibrant deep-red colour and long shelf life. Ideal for hot sauce, pickle, and spice blend manufacturers.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/112780/pexels-photo-112780.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: 'Byadgi Chilli',
      slug: 'byadgi-chilli',
      variety: 'Kaddi',
      shuMin: 10000,
      shuMax: 20000,
      astaValue: '150+ ASTA',
      moisture: '≤ 11%',
      description:
        'Grown in the Byadgi region of Karnataka, this wrinkled chilli is the gold standard for colour. Extremely high ASTA value with mild heat — preferred by paprika processors, food colourant manufacturers and premium spice blenders globally.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/221140/pexels-photo-221140.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: 'Kashmiri Chilli',
      slug: 'kashmiri-chilli',
      variety: 'Round',
      shuMin: 2000,
      shuMax: 5000,
      astaValue: '200+ ASTA',
      moisture: '≤ 12%',
      description:
        'The world\'s finest colour chilli. Kashmiri Round delivers an unmatched deep crimson hue with negligible heat. Sourced from certified farms in Jammu & Kashmir and exported to colour-sensitive food industries across Europe and the Middle East.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: 'Guntur Sannam',
      slug: 'guntur-sannam',
      variety: 'S4',
      shuMin: 25000,
      shuMax: 45000,
      astaValue: '25–30 ASTA',
      moisture: '≤ 12%',
      description:
        'The most traded Guntur variety. S4 Sannam strikes the ideal balance between heat and colour, making it the preferred ingredient for curry powders, sambal, and ethnic spice blends in Asian, African and Latin American markets.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/4109912/pexels-photo-4109912.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: 'Turmeric Fingers',
      slug: 'turmeric',
      variety: 'Erode / Nizamabad',
      shuMin: null,
      shuMax: null,
      astaValue: null,
      moisture: '≤ 10%',
      description:
        'Premium whole turmeric fingers sourced from Erode and Nizamabad — India\'s leading turmeric belts. Curcumin content 3–5%. Clean, polished, with low moisture and high oleoresin content. Suitable for pharmaceutical, nutraceutical and food processing industries.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/6220710/pexels-photo-6220710.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: 'Coffee Arabica',
      slug: 'coffee-arabica',
      variety: 'Arabica',
      shuMin: null,
      shuMax: null,
      astaValue: null,
      moisture: '≤ 12%',
      description:
        'Single-origin Arabica from the shade-grown estates of Coorg and Chikmagalur. Notes of stone fruit, jasmine and soft acidity. Available as green beans (washed / natural / honey process) or roasted to specification. Exported to specialty roasters across Europe and North America.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/942803/pexels-photo-942803.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: 'Coffee Robusta',
      slug: 'coffee-robusta',
      variety: 'Robusta',
      shuMin: null,
      shuMax: null,
      astaValue: null,
      moisture: '≤ 12%',
      description:
        'Bold, full-bodied Robusta from the Wayanad and Coorg highlands. Higher caffeine content and earthy depth make it ideal for espresso blends and instant coffee manufacturing. Consistent quality, large-volume availability.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      name: 'Spice Powders',
      slug: 'spice-powders',
      variety: 'Custom Blends',
      shuMin: null,
      shuMax: null,
      astaValue: null,
      moisture: '≤ 8%',
      description:
        'Precision-ground spice powders processed in our ISO 22000 certified facility. Natural volatile oils retained through controlled grinding temperatures. Available: chilli powder, turmeric powder, coriander powder, cumin powder, and custom blends to your specification. Packed in food-grade HDPE sacks or retail pouches.',
      status: ProductStatus.ACTIVE,
      imageUrl:
        'https://images.pexels.com/photos/4198417/pexels-photo-4198417.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
  ];

  for (const product of products) {
    const { imageUrl, ...productData } = product;

    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });
    if (existing) {
      console.log(`  Skipping existing product: ${productData.name}`);
      continue;
    }

    const created = await prisma.product.create({ data: productData });

    await prisma.mediaFile.create({
      data: {
        key: `seed/${productData.slug}-hero.jpg`,
        url: imageUrl,
        mimeType: 'image/jpeg',
        sizeBytes: 0,
        uploadedBy: 'seed',
        productId: created.id,
      },
    });

    console.log(`  Created product: ${productData.name}`);
  }

  // ── Certifications ─────────────────────────────────────────────────────────

  const certs = [
    {
      name: 'ISO 22000:2018',
      issuingBody: 'SGS India Pvt. Ltd.',
      certNumber: 'SGS-ISO22000-2024-0312',
      issuedAt: new Date('2024-03-12'),
      expiresAt: new Date('2027-03-11'),
      fileUrl: '/certs/iso22000.pdf',
      active: true,
    },
    {
      name: 'HACCP Certification',
      issuingBody: 'Bureau Veritas India',
      certNumber: 'BV-HACCP-2024-0688',
      issuedAt: new Date('2024-05-01'),
      expiresAt: new Date('2027-04-30'),
      fileUrl: '/certs/haccp.pdf',
      active: true,
    },
    {
      name: 'APEDA Registration',
      issuingBody: 'Agricultural & Processed Food Products Export Development Authority',
      certNumber: 'APEDA-AP-2025-00471',
      issuedAt: new Date('2025-01-10'),
      expiresAt: new Date('2027-01-09'),
      fileUrl: '/certs/apeda.pdf',
      active: true,
    },
    {
      name: 'Spices Board Certificate',
      issuingBody: 'Spices Board of India — Ministry of Commerce',
      certNumber: 'SB-EXP-2025-11832',
      issuedAt: new Date('2025-04-01'),
      expiresAt: new Date('2026-06-15'),
      fileUrl: '/certs/spicesboard.pdf',
      active: true,
    },
    {
      name: 'FSSAI License',
      issuingBody: 'Food Safety and Standards Authority of India',
      certNumber: '12424999000512',
      issuedAt: new Date('2024-08-15'),
      expiresAt: new Date('2027-08-14'),
      fileUrl: '/certs/fssai.pdf',
      active: true,
    },
  ];

  for (const cert of certs) {
    const existing = await prisma.certification.findFirst({
      where: { certNumber: cert.certNumber },
    });
    if (existing) {
      console.log(`  Skipping existing cert: ${cert.name}`);
      continue;
    }
    await prisma.certification.create({ data: cert });
    console.log(`  Created cert: ${cert.name}`);
  }

  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
