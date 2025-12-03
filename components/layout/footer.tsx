import Link from "next/link";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-center sm:justify-start gap-4">
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
          <div className="text-center sm:text-right">
            <p>© {new Date().getFullYear()} NCS 훈련생 성적관리 시스템</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

