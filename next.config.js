// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // 번들 크기 최적화
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  // 컴파일러 최적화
  swcMinify: true,
  // 프로덕션 빌드 최적화
  productionBrowserSourceMaps: false, // 소스맵 비활성화로 빌드 속도 향상
  // 코드 스플리팅 최적화
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 서버 사이드에서 isomorphic-dompurify와 jsdom 제외
      config.externals = config.externals || [];
      config.externals.push({
        'isomorphic-dompurify': 'commonjs isomorphic-dompurify',
        'jsdom': 'commonjs jsdom',
      });
    } else {
      // 클라이언트 번들 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // React 및 React DOM을 별도 청크로 분리
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20,
            },
            // UI 라이브러리를 별도 청크로 분리
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]components[\\/]ui[\\/]/,
              priority: 10,
            },
            // 공통 유틸리티를 별도 청크로 분리
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
          },
        },
      };
    }
    return config;
  },
}

// Bundle Analyzer와 Sentry 설정을 함께 적용
const configWithAnalyzer = withBundleAnalyzer(nextConfig);

module.exports = withSentryConfig(configWithAnalyzer, {
  // Sentry 프로젝트 설정
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // 소스맵 업로드 설정
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})

