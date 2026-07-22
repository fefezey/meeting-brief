import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * CSS sınıflarını güvenli şekilde birleştirir.
 *
 * clsx     -> koşullu sınıfları toplar:  cn('p-4', isBig && 'text-xl')
 * twMerge  -> çakışanları temizler:      cn('p-4', 'p-8') => 'p-8'
 *
 * Tüm shadcn bileşenleri bu fonksiyonu kullanır.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/* --- Aşağıdakiler sadece TİP yardımcıları: çalışma anında hiçbir şey yapmazlar,
   sadece TypeScript'in bileşen özelliklerini doğru anlamasını sağlarlar. --- */

/** Bir tipten "child" özelliğini çıkarır */
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;

/** Bir tipten "children" özelliğini çıkarır */
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;

/** Her ikisini birden çıkarır */
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

/**
 * Bir bileşene "ref" özelliği ekler.
 * ref = ekrandaki gerçek HTML elemanına doğrudan erişim
 * (ör. bir input'a odaklanmak için gerekir)
 */
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
