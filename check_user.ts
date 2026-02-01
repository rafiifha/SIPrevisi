import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking users...')
    const users = await prisma.user.findMany()
    console.log('Found users:', users.length)

    for (const u of users) {
        console.log(`User: ${u.username}, Role: ${u.role}, Hash: ${u.password.substring(0, 10)}...`)
        const valid = await bcrypt.compare('123456', u.password)
        console.log(`Password '123456' valid? ${valid}`)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
