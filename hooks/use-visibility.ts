import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 统一页面可见性管理 Hook
 *
 * NOTE: 解决的核心问题——页面从 hidden→visible 时，多个组件各自监听
 * visibilitychange 会导致大量并发请求。此 hook 提供统一的可见状态
 * 和防抖回调，确保恢复时的操作有序执行。
 *
 * @param onVisible 页面恢复可见时的回调（防抖 300ms，同一轮只触发一次）
 * @returns 当前页面是否可见
 */
export function useVisibility(onVisible?: () => void): boolean {
    const [isVisible, setIsVisible] = useState(
        () => typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    );

    // NOTE: 用 ref 持有回调引用，避免频繁的 effect 重新订阅
    const onVisibleRef = useRef(onVisible);
    onVisibleRef.current = onVisible;

    // 防抖定时器
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = document.visibilityState === 'visible';
            setIsVisible(visible);

            if (visible && onVisibleRef.current) {
                // NOTE: 防抖 300ms，避免快速切换时重复触发
                // 场景：用户在多个 tab 间快速来回切换
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                    debounceTimerRef.current = null;
                    onVisibleRef.current?.();
                }, 300);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return isVisible;
}
