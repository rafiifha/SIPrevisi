import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing passwords...')
    const hashedPassword = await bcrypt.hash('123456', 10)

    await prisma.user.update({
        where: { username: 'karyawan' },
        data: { password: hashedPassword }
    })
    console.log('User karyawan updated.')

    await prisma.user.update({
        where: { username: 'owner' },
        data: { password: hashedPassword }
    })
    console.log('User owner updated.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
