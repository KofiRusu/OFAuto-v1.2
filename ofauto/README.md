# OFAuto - OnlyFans/Fansly Automation Suite

OFAuto is a comprehensive automation platform for content creators, enabling seamless management of OnlyFans, Fansly, and other creator platforms through a unified dashboard.

![OFAuto Dashboard Preview](https://yourdomain.com/images/dashboard-preview.png)

## 🚀 Features

- **Multi-Platform Integration**: Connect OnlyFans, Fansly, Patreon, Ko-fi and more
- **Content Scheduling**: Schedule and automate posts across platforms
- **Follower Management**: Monitor new followers and engagement
- **Automated Messaging**: Send personalized messages with AI-powered personas
- **Analytics Dashboard**: Track earnings, follower growth, and engagement
- **Strategy Generation**: AI-powered content and pricing strategies
- **Queue Management**: Monitor automation tasks and retry failed operations

## 📋 Requirements

- Node.js 18+
- PostgreSQL 15+
- Clerk account for authentication
- (Optional) Redis for production rate limiting

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ofauto.git
cd ofauto
```

2. Install dependencies:
```bash
npm install
```

3. Set up the environment variables:
```bash
cp .env.example .env.local
```

4. Create and migrate the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. (Optional) Seed demo data:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

## 🌐 Demo Mode

OFAuto includes a demo mode for easy testing and exploration:

1. Enable demo mode:
```bash
echo "DEMO_MODE=true" >> .env.local
```

2. Seed demo data:
```bash
npm run seed:demo
```

3. Run with demo mode:
```bash
npm run dev
```

## 🧪 Testing & QA

Run the QA check script to verify the application's health:

```bash
npm run qa
```

This will:
- Check database connectivity
- Test API endpoints
- Verify environment variables
- Generate a comprehensive report

## 📚 Documentation

For complete documentation and API reference, visit [docs.ofauto.app](https://docs.ofauto.app).

## 🚢 Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set up the required environment variables
3. Deploy with the following settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`

### Docker

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

## 🧰 Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Recharts
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Deployment**: Vercel / Docker

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support inquiries, contact support@ofauto.app or join our [Discord community](https://discord.gg/ofauto).
