// Simple script to test auth functionality without bcrypt
const { PrismaClient, UserRole } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const cryptoNode = require('crypto');

const prisma = new PrismaClient();

// Mock JWT_SECRET (would be from env in production)
const JWT_SECRET = 'test-secret-key-for-auth-testing-only';

async function main() {
  try {
    console.log('Starting auth system test...');
    
    // 1. Clean up any existing test data
    await prisma.otpCode.deleteMany({
      where: { email: 'test-otp@example.com' }
    });
    
    console.log('Database cleanup completed');
    
    // 2. Create a test user (for linking purposes)
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'mock-hashed-password',
        role: UserRole.MODEL,
        clerkId: `clerk_test_${Date.now()}`
      }
    });
    
    console.log('Created test user:', user.id);
    
    // 3. Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, tokenVersion: user.tokenVersion || 1 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('Generated tokens successfully');
    
    // 4. Verify tokens
    const decodedAccessToken = jwt.verify(accessToken, JWT_SECRET);
    console.log('Access token verified:', decodedAccessToken);
    
    // 5. Create OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const otpRecord = await prisma.otpCode.create({
      data: {
        email: 'test-otp@example.com',
        name: 'OTP Test User',
        code: otp,
        type: 'REGISTRATION',
        expiresAt: otpExpiry
      }
    });
    
    console.log('Created OTP:', otpRecord);
    
    // 6. Test password reset
    const resetToken = cryptoNode.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const passwordReset = await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetExpiry
      }
    });
    
    console.log('Created password reset token:', passwordReset);
    
    // 7. Clean up test data
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id }
    });
    
    await prisma.otpCode.delete({
      where: { id: otpRecord.id }
    });
    
    await prisma.user.delete({
      where: { id: user.id }
    });
    
    console.log('Auth system test completed successfully!');
  } catch (error) {
    console.error('Auth system test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 