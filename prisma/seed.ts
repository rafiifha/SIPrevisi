import { PrismaClient, TipeTrx } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * SEED SCRIPT - 50 TRANSAKSI PER HARI
 * Generate 50 transaksi per hari selama 3 bulan ke belakang
 */

async function main() {
    console.log('🌱 Starting seed: 50 transaksi/hari selama 3 bulan...')
    console.log('⚠️  Total estimasi: ~4,500 transaksi')
    console.log('⚠️  Estimated time: 1-2 minutes\n')

    // 1. Buat Users
    const hashedPassword = await bcrypt.hash('123456', 10)

    await prisma.user.upsert({
        where: { username: 'karyawan' },
        update: {},
        create: {
            username: 'karyawan',
            password: hashedPassword,
            role: 'KARYAWAN'
        }
    })

    await prisma.user.upsert({
        where: { username: 'owner' },
        update: {},
        create: {
            username: 'owner',
            password: hashedPassword,
            role: 'OWNER'
        }
    })

    console.log('✅ Users created')

    // 2. Buat Kategori
    const kategoriData = [
        { nama: 'Sembako' },
        { nama: 'Minuman' },
        { nama: 'Snack' },
        { nama: 'Kebutuhan Rumah Tangga' },
        { nama: 'Alat Tulis' }
    ]

    const kategoriList = []
    for (const kat of kategoriData) {
        const kategori = await prisma.kategori.upsert({
            where: { nama: kat.nama },
            update: {},
            create: kat
        })
        kategoriList.push(kategori)
    }

    console.log('✅ Kategori created:', kategoriList.length)

    // 3. Buat Barang
    const barangData = [
        // Sembako
        { kode: 'BRG001', nama: 'Beras 5kg', stok: 100, satuan: 'Kg', leadTime: 7, kategoriId: kategoriList[0].id },
        { kode: 'BRG002', nama: 'Gula Pasir 1kg', stok: 80, satuan: 'Kg', leadTime: 5, kategoriId: kategoriList[0].id },
        { kode: 'BRG003', nama: 'Minyak Goreng 2L', stok: 60, satuan: 'Liter', leadTime: 10, kategoriId: kategoriList[0].id },
        { kode: 'BRG004', nama: 'Tepung Terigu 1kg', stok: 50, satuan: 'Kg', leadTime: 7, kategoriId: kategoriList[0].id },
        { kode: 'BRG005', nama: 'Telur Ayam (isi 10)', stok: 40, satuan: 'Pack', leadTime: 3, kategoriId: kategoriList[0].id },
        
        // Minuman
        { kode: 'BRG006', nama: 'Air Mineral 1500ml', stok: 150, satuan: 'Botol', leadTime: 5, kategoriId: kategoriList[1].id },
        { kode: 'BRG007', nama: 'Teh Kotak', stok: 100, satuan: 'Kotak', leadTime: 7, kategoriId: kategoriList[1].id },
        { kode: 'BRG008', nama: 'Kopi Sachet', stok: 200, satuan: 'Sachet', leadTime: 5, kategoriId: kategoriList[1].id },
        { kode: 'BRG009', nama: 'Susu UHT 1L', stok: 70, satuan: 'Kotak', leadTime: 7, kategoriId: kategoriList[1].id },
        
        // Snack
        { kode: 'BRG010', nama: 'Biskuit Marie', stok: 90, satuan: 'Pack', leadTime: 7, kategoriId: kategoriList[2].id },
        { kode: 'BRG011', nama: 'Keripik Kentang', stok: 60, satuan: 'Pack', leadTime: 5, kategoriId: kategoriList[2].id },
        { kode: 'BRG012', nama: 'Wafer Coklat', stok: 80, satuan: 'Pack', leadTime: 7, kategoriId: kategoriList[2].id },
        
        // Kebutuhan Rumah Tangga
        { kode: 'BRG013', nama: 'Sabun Mandi', stok: 100, satuan: 'Pcs', leadTime: 14, kategoriId: kategoriList[3].id },
        { kode: 'BRG014', nama: 'Pasta Gigi', stok: 80, satuan: 'Pcs', leadTime: 14, kategoriId: kategoriList[3].id },
        { kode: 'BRG015', nama: 'Shampo Sachet', stok: 150, satuan: 'Sachet', leadTime: 7, kategoriId: kategoriList[3].id },
        
        // Alat Tulis
        { kode: 'BRG016', nama: 'Pensil 2B', stok: 120, satuan: 'Pcs', leadTime: 10, kategoriId: kategoriList[4].id },
        { kode: 'BRG017', nama: 'Buku Tulis 58 lembar', stok: 100, satuan: 'Pcs', leadTime: 14, kategoriId: kategoriList[4].id },
        { kode: 'BRG018', nama: 'Pulpen Hitam', stok: 150, satuan: 'Pcs', leadTime: 10, kategoriId: kategoriList[4].id },
        { kode: 'BRG019', nama: 'Penghapus', stok: 100, satuan: 'Pcs', leadTime: 10, kategoriId: kategoriList[4].id },
        { kode: 'BRG020', nama: 'Penggaris 30cm', stok: 80, satuan: 'Pcs', leadTime: 10, kategoriId: kategoriList[4].id },
    ]

    const barangList = []
    for (const brg of barangData) {
        const barang = await prisma.barang.upsert({
            where: { kode: brg.kode },
            update: {
                stok: brg.stok,
                leadTime: brg.leadTime
            },
            create: brg
        })
        barangList.push(barang)
    }

    console.log('✅ Barang created:', barangList.length)

    // 4. Generate Transaksi - 50 per hari selama 3 bulan
    console.log('🔄 Generating 50 transactions per day for 3 months...\n')
    
    const today = new Date()
    const threeMonthsAgo = new Date(today)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    let totalTransaksi = 0
    const batchSize = 100
    let transaksiBatch: any[] = []
    
    // Hitung jumlah hari dalam 3 bulan
    const daysDiff = Math.floor((today.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24))
    
    // Loop untuk setiap hari
    for (let dayOffset = 0; dayOffset <= daysDiff; dayOffset++) {
        const currentDate = new Date(threeMonthsAgo)
        currentDate.setDate(threeMonthsAgo.getDate() + dayOffset)
        
        // Generate 50 transaksi untuk hari ini
        const transaksiPerHari = 50
        
        for (let i = 0; i < transaksiPerHari; i++) {
            // Random barang
            const randomBarang = barangList[Math.floor(Math.random() * barangList.length)]
            
            // Random waktu dalam sehari (08:00 - 20:00)
            const transaksiDate = new Date(currentDate)
            transaksiDate.setHours(Math.floor(Math.random() * 12) + 8) // 8-19
            transaksiDate.setMinutes(Math.floor(Math.random() * 60))
            transaksiDate.setSeconds(Math.floor(Math.random() * 60))
            
            // 80% JUAL, 20% BELI
            const tipeTransaksi = Math.random() < 0.8 ? TipeTrx.JUAL : TipeTrx.BELI
            
            // Jumlah random
            let jumlah: number
            if (tipeTransaksi === TipeTrx.JUAL) {
                // Penjualan: 1-15 unit
                jumlah = Math.floor(Math.random() * 15) + 1
            } else {
                // Pembelian: 20-100 unit
                jumlah = Math.floor(Math.random() * 81) + 20
            }
            
            transaksiBatch.push({
                barangId: randomBarang.id,
                tipe: tipeTransaksi,
                jumlah: jumlah,
                tanggal: transaksiDate
            })
            
            totalTransaksi++
            
            // Insert batch
            if (transaksiBatch.length >= batchSize) {
                await prisma.transaksi.createMany({
                    data: transaksiBatch
                })
                transaksiBatch = []
            }
        }
        
        // Progress indicator setiap 10 hari
        if ((dayOffset + 1) % 10 === 0 || dayOffset === daysDiff) {
            const progress = Math.round(((dayOffset + 1) / (daysDiff + 1)) * 100)
            console.log(`   Progress: ${progress}% (${dayOffset + 1}/${daysDiff + 1} hari, ${totalTransaksi} transaksi)`)
        }
    }
    
    // Insert sisa batch
    if (transaksiBatch.length > 0) {
        await prisma.transaksi.createMany({
            data: transaksiBatch
        })
    }

    console.log('\n✅ Transactions created:', totalTransaksi)

    // 5. Summary dengan statistik
    const stats = await prisma.transaksi.groupBy({
        by: ['tipe'],
        _count: { id: true }
    })
    
    const jualCount = stats.find(s => s.tipe === 'JUAL')?._count.id || 0
    const beliCount = stats.find(s => s.tipe === 'BELI')?._count.id || 0

    console.log('\n📊 Seed Summary:')
    console.log('========================')
    console.log(`👥 Users: 2`)
    console.log(`📁 Kategori: ${kategoriList.length}`)
    console.log(`📦 Barang: ${barangList.length}`)
    console.log(`💰 Total Transaksi: ${totalTransaksi}`)
    console.log(`   - JUAL: ${jualCount} (${Math.round(jualCount/totalTransaksi*100)}%)`)
    console.log(`   - BELI: ${beliCount} (${Math.round(beliCount/totalTransaksi*100)}%)`)
    console.log(`\n📅 Periode Data: 3 bulan (${daysDiff + 1} hari)`)
    console.log(`📈 Transaksi per hari: ~${Math.round(totalTransaksi / (daysDiff + 1))}`)
    console.log(`📊 Transaksi per barang: ~${Math.round(totalTransaksi / barangList.length)}`)
    console.log(`\n✅ Seed completed!`)
    console.log(`\n🔐 Login credentials:`)
    console.log(`   Username: karyawan | Password: 123456`)
    console.log(`   Username: owner    | Password: 123456`)
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })