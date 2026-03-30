import { prisma } from './prisma'
import type { AdminUser } from '@/generated/prisma/client'

export type { AdminUser }

export async function isAdminEmail(email: string): Promise<boolean> {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  })
  return !!user
}

export async function getAdminUser(email: string): Promise<AdminUser | null> {
  return prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  })
}

export async function updateLastLogin(email: string): Promise<void> {
  await prisma.adminUser.update({
    where: { email: email.toLowerCase() },
    data: { lastLogin: new Date() },
  })
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  return prisma.adminUser.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function addAdminUser(
  email: string,
  name: string,
  role: string = 'admin'
): Promise<AdminUser> {
  try {
    return await prisma.adminUser.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role,
      },
    })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      throw new Error('User already exists')
    }
    throw e
  }
}

export async function deleteAdminUser(email: string): Promise<void> {
  try {
    await prisma.adminUser.delete({
      where: { email: email.toLowerCase().trim() },
    })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
      throw new Error('User not found')
    }
    throw e
  }
}
