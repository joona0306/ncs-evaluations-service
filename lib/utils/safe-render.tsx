/**
 * XSS 방지를 위한 안전한 렌더링 유틸리티
 * 클라이언트 사이드에서만 사용
 */

"use client";

import { sanitizeInput, sanitizeHTML, sanitizeURL } from "@/lib/security";
import React, { useEffect, useState } from "react";

/**
 * 사용자 입력 텍스트를 안전하게 렌더링합니다.
 * HTML 태그는 모두 제거되고 텍스트만 표시됩니다.
 * 
 * @param text - 렌더링할 텍스트
 * @returns 안전하게 sanitize된 텍스트
 */
export function safeText(text: string | null | undefined): string {
  if (!text) return "";
  return sanitizeInput(text, false);
}

/**
 * HTML 콘텐츠를 안전하게 렌더링합니다.
 * 제한된 HTML 태그만 허용됩니다.
 * 
 * @param html - 렌더링할 HTML 문자열
 * @returns 안전하게 sanitize된 HTML 문자열
 */
export function safeHTML(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHTML(html);
}

/**
 * URL을 안전하게 렌더링합니다.
 * 
 * @param url - 렌더링할 URL 문자열
 * @returns 안전하게 sanitize된 URL 또는 빈 문자열
 */
export function safeURL(url: string | null | undefined): string {
  if (!url) return "";
  return sanitizeURL(url);
}

/**
 * 안전한 텍스트를 렌더링하는 React 컴포넌트
 */
export function SafeText({ 
  children, 
  className 
}: { 
  children: string | null | undefined;
  className?: string;
}) {
  return <span className={className}>{safeText(children)}</span>;
}

/**
 * 안전한 HTML을 렌더링하는 React 컴포넌트
 * 클라이언트 사이드에서 DOMPurify로 sanitize된 콘텐츠를 사용합니다.
 */
export function SafeHTML({ 
  html, 
  className 
}: { 
  html: string | null | undefined;
  className?: string;
}) {
  const [sanitized, setSanitized] = useState<string>("");

  useEffect(() => {
    if (!html) {
      setSanitized("");
      return;
    }

    // 클라이언트 사이드에서 DOMPurify 동적 임포트
    import("isomorphic-dompurify").then((DOMPurify) => {
      const cleaned = DOMPurify.default.sanitize(html, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ol", "ul", "li", "a"],
        ALLOWED_ATTR: ["href", "target", "rel"],
        ALLOW_DATA_ATTR: false,
      });
      setSanitized(cleaned);
    }).catch(() => {
      // DOMPurify 로드 실패 시 기본 sanitization 사용
      setSanitized(safeHTML(html));
    });
  }, [html]);

  if (!sanitized) return null;

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

