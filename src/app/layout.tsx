import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Lao } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoLaoSans = Noto_Sans_Lao({
  subsets: ['lao'],
  variable: '--font-noto-lao',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const basePath = process.env.NODE_ENV === 'production' ? '/english' : '';

export const metadata: Metadata = {
  title: 'English Learning - ຮຽນພາສາອັງກິດ & AI Interactive',
  description: 'ແອັບພລິເຄຊັນຮຽນຮູ້ ແລະ ທ່ອງຈຳຄຳສັບພາສາອັງກິດ 200,000 ຄຳສັບ ພ້ອມສົນທະນາ AI ແລະ ຄຳແປພາສາລາວ',
  applicationName: 'English Learning',
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'English Learning',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: `${basePath}/icons/icon-192x192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icons/icon-512x512.png`, sizes: '512x512', type: 'image/png' },
      { url: `${basePath}/icons/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: `${basePath}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="lo"
      className={`${inter.variable} ${notoLaoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script to prevent theme flickering on initial load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme) {
                    try {
                      var parsed = JSON.parse(theme);
                      theme = parsed;
                    } catch (e) {}
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-scale-up">
            {children}
          </div>
        </main>

        {/* PWA Install Prompt & Service Worker Registration */}
        <PwaInstallPrompt />

        {/* Footer */}
        <footer className="border-t border-border bg-secondary/30 py-6 text-center text-xs text-muted">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} English Learning App.</p>
            <p className="flex items-center gap-1.5">
              <span>ຮຽນຮູ້ຢ່າງຕໍ່ເນື່ອງ ເພື່ອອະນາຄົດທີ່ດີກວ່າ</span>
              <span className="text-red-500 animate-pulse">❤️</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
