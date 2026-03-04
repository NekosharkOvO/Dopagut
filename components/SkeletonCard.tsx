import React from 'react';

interface SkeletonCardProps {
    /** 预设布局类型 */
    variant?: 'card' | 'stat' | 'list-item' | 'header';
    className?: string;
}

/**
 * 通用骨架屏组件
 * 数据加载时显示脉冲闪烁的灰色占位块
 */
export default function SkeletonCard({ variant = 'card', className = '' }: SkeletonCardProps) {
    if (variant === 'header') {
        return (
            <div className={`skeleton-pulse space-y-3 p-4 ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-gray-300" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                        <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'stat') {
        return (
            <div className={`skeleton-pulse bg-gray-100 border-4 border-gray-200 rounded-2xl p-4 ${className}`}>
                <div className="h-3 bg-gray-200 rounded-lg w-1/2 mb-3" />
                <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-2" />
                <div className="h-2 bg-gray-200 rounded-lg w-full" />
            </div>
        );
    }

    if (variant === 'list-item') {
        return (
            <div className={`skeleton-pulse flex items-center gap-3 p-3 ${className}`}>
                <div className="w-10 h-10 rounded-xl bg-gray-200 border-2 border-gray-300 shrink-0" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 bg-gray-200 rounded-lg w-2/3" />
                    <div className="h-2 bg-gray-200 rounded-lg w-1/3" />
                </div>
            </div>
        );
    }

    // variant === 'card' 默认
    return (
        <div className={`skeleton-pulse bg-gray-100 border-4 border-gray-200 rounded-2xl p-5 space-y-3 ${className}`}>
            <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
            <div className="h-3 bg-gray-200 rounded-lg w-full" />
            <div className="h-3 bg-gray-200 rounded-lg w-5/6" />
            <div className="h-20 bg-gray-200 rounded-xl w-full mt-2" />
        </div>
    );
}
